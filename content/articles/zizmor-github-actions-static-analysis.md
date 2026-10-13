---
title: "A first look at zizmor: static analysis for GitHub Actions"
slug: zizmor-github-actions-static-analysis
excerpt: "A small look  on what zizmor can catch, how to gate CI with it and its limits."
category: devsecops
tags: [github-actions, ci-cd, static-analysis, supply-chain]
published: true
publishedAt: 2026-10-11
---


In a nutshell, zizmor is a static analysis tool in the same family as semgrep, Snyk or Trivy,  but built with a single focus on **GitHub Actions**. So instead of running and maintaining your own custom static rules, zizmor ships a solid, curated set of audits to help secure your pipelines out of the box.

## How it works

It parses your workflow (and action) files, applies its audits, and reports findings with three things attached to each one:

- **location** — down to the file, line and column,
- **severity** — `informational`, `low`, `medium` or `high`,
- **confidence** — how sure zizmor is that it's a real problem, not just a false alarm.

One thing worth internalizing early: **zizmor never runs your workflows or their scripts.** It's purely static. It reads the YAML, understands the structure, jobs, steps, permissions, `${{ }}` expansions and looks for structural weaknesses like over-privileged jobs or script injection sinks. If your danger lives in a shell script called at runtime, zizmor won't see it (more on that at the end).

## What it actually looks for

I won't reproduce the full catalog here, the [audit rules docs](https://docs.zizmor.sh/audits/) does it better, but a few of the audits justify the tool on their own:

- `template-injection` — script injection through `${{ }}` expansions in `run:` blocks (the classic `echo "${{ github.event.issue.title }}"` footgun),
- `excessive-permissions` — jobs holding on to more `permissions:` than they actually use,
- `unpinned-uses` — actions referenced by mutable tag instead of a pinned commit SHA,
- `cache-poisoning` and `artipacked` — the quieter ones, like `actions/checkout` persisting credentials into a workspace a build step can read.

Each finding links to its own documentation page explaining the attack scenario and the fix.

## Running it in CI

It is a dedicated job, centralized in the Security tab like every other scanner, it's always important for artifacts :

```yaml
# gates the pipeline: fails the job on any finding.
zizmor:
  runs-on: ubuntu-24.04
  timeout-minutes: 10
  permissions:
    contents: read

  steps:
  - name: Checkout code
    uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 #v6
    with:
      persist-credentials: false

  - name: Run zizmor
    uses: zizmorcore/zizmor-action@cc914d7f3750a2d13d75c7f184a1060aa0e9d482 #v0.6.4
    with:
      # Pin the zizmor CLI: the action's default (`latest`) moves on
      # upstream releases, breaking reproducibility of a green run.
      version: 1.30.1
      # Gate instead of report: fail on findings rather than uploading
      # SARIF (which would leave the job green regardless of results).
      advanced-security: false
```

The action's default (`advanced-security: true`) uploads the findings as SARIF to code scanning, so alerts land in **Security → Code scanning**,  deduplicated across runs and triaged in one place, right next to other findings, that's mostly the case of the current project.

One subtlety worth knowing, with `advanced-security: true` (the default) zizmor **reports** but never actually gates, the job stays green and the alerts accumulate in the Security tab. With `advanced-security: false` the action skips the upload and instead fails the job on findings, using zizmor's exit codes (`13` for a highest-severity medium, `14` for high).

The two modes don't cancel each other out, they're just two different jobs. You can simply run both.

```yaml
  zizmor-report:            # reporting: uploads SARIF, never gates
    permissions:
      contents: read
      security-events: write
    steps:
    - uses: zizmorcore/zizmor-action@cc914d7f3750a2d13d75c7f184a1060aa0e9d482 #v0.6.4
      with:
        version: 1.30.1

  zizmor:                   # gating: no upload, fails on findings
    permissions:
      contents: read
    steps:
    - uses: zizmorcore/zizmor-action@cc914d7f3750a2d13d75c7f184a1060aa0e9d482 #v0.6.4
      with:
        version: 1.30.1
        advanced-security: false
```

The trade-off is running the audit twice , it's a fast scan, and the report/gate separation means you keep one pane of glass for triage *and* a check that actually gates.

A small detail: the action's default zizmor version is `latest`, which quietly moves on upstream releases. Pinning the CLI version keeps a run reproducible, you'll see this a lot in my workflows, that assures hermeticity, that's a principle for another article.


## Arguments

A couple of knobs worth knowing:

- `collects:` — what to actually scan when zizmor walks a repository: `default` (everything, respecting `.gitignore`), `all`, or narrowed to `workflows`, `actions`, `dependabot` (yes, it audits Dependabot configs too), or `pre-commit` inputs.
- `config:` — a `zizmor.yml` file, either auto-discovered at the repo root or passed explicitly. This is where per-rule ignores live, down to `workflow.yml:line:col` granularity:

```yaml
rules:
  template-injection:
    ignore:
      - safe.yml
```

There's also a `personas` knob (`regular` / `pedantic` / `auditor`) that scales how noisy the analysis gets. The default `regular` persona is tuned for high-signal CI use; `auditor` flags everything, including likely false positives, useful when you want to be quite strict.

## What it can actually catch

Here are two real findings from the first run of my own pipeline, i've left some deliberate issues for the demo.

Missing SHA pin, potentially leading to Supply Chain, when `tj-actions/changed-files` was compromised in March 2025 (CVE-2025-30066), a large chunk of the 23,000+ affected repositories were hit through exactly this pattern, mutable tag references that an attacker could re-point. [Trivy's own CI was among the victims](https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066) a security scanner taken down by an unpinned action.


```text
error[unpinned-uses]: unpinned action reference
  --> ./.github/workflows/ci-cd-pipeline-parallel.yml:35:13
   |
35 |       uses: actions/checkout@v6
   |             ^^^^^^^^^^^^^^^^^^^ action is not pinned to a hash (required by blanket policy)
   |
   = note: audit confidence → High
   = note: this finding has an auto-fix
```

Note the wording: *(required by blanket policy)* it treats hash pinning as a repo-wide policy, not a suggestion. The job itself failed with exit code `14`, the code the tool reserves for "at least one high-severity finding".

Both findings ship with auto-fixes (`--fix` applies the safe ones in place), and both link to a documentation page explaining the attack scenario and the recommended resolution.

## What zizmor is *not*

 Zizmor audits **workflow and action definitions only**. It doesn't analyze the scripts they reference, doesn't execute anything, and can't reason about values that only exist at runtime, a build matrix generated by a previous job, for instance. Where things are unknowable statically, it errs on the side of flagging rather than staying silent.

A workflow can be spotless from zizmor's point of view and still be dangerous:

```yaml
- name: Deploy
  run: ./scripts/deploy.sh
```

Inside `deploy.sh`:

```bash
curl -fsSL "https://internal.example.com/installer.sh" | bash
```

The script fetches and executes whatever that URL serves *at runtime*. Nothing in the repository carries the risk and the URL could point anywhere after a DNS takeover or a compromised internal host. That's a shell-level problem, pairing zizmor with shell-aware rules that cover the scripts themselves is crucial.

## References

- [zizmor documentation](https://docs.zizmor.sh/) — usage, configuration and operating modes,
- [zizmor audit rules](https://docs.zizmor.sh/audits/) — the full catalog of audits, each with the attack scenario and the fix,
- [zizmorcore/zizmor-action](https://github.com/zizmorcore/zizmor-action) — the GitHub Action used in this post,
- [CISA advisory — Supply Chain Compromise of tj-actions/changed-files (CVE-2025-30066)](https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction),
- [Wiz — GitHub Action tj-actions/changed-files supply chain attack](https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066) — the incident writeup behind the Trivy reference.
