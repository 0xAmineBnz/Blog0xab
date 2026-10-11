---
title: "A first look at zizmor: static analysis for GitHub Actions"
slug: zizmor-github-actions-static-analysis
excerpt: "I was about to write custom audit rules for my GitHub Actions pipelines when I thought to myself that someone has probably already built something similar."
category: devsecops
tags: [github-actions, ci-cd, static-analysis, supply-chain]
published: true
publishedAt: 2026-10-11
---


In a nutshell, zizmor is a static analysis tool — in the same family as semgrep, Snyk or Trivy — but built with a single focus: **GitHub Actions**. So instead of running and maintaining your own custom static rules, zizmor ships a solid, curated set of audits to help secure your pipelines out of the box.

## How it works

It parses your workflow (and action) files, applies its audits, and reports findings with three things attached to each one:

- **location** — down to the file, line and column,
- **severity** — `informational`, `low`, `medium` or `high`,
- **confidence** — how sure zizmor is that it's a real problem, not just a false alarm.

One thing worth internalizing early: **zizmor never runs your workflows or their scripts.** It's purely static. It reads the YAML, understands the structure — jobs, steps, permissions, `${{ }}` expansions — and looks for structural weaknesses like over-privileged jobs or script injection sinks. If your danger lives in a shell script called at runtime, zizmor won't see it (more on that at the end).

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
# centralized in the Security tab like every other scanner here.
zizmor:
  runs-on: ubuntu-24.04
  timeout-minutes: 10
  permissions:
    contents: read
    security-events: write # SARIF upload to code scanning (Security tab).

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
```

The action's default (`advanced-security: true`) uploads the findings as SARIF to code scanning, so alerts land in **Security → Code scanning**,  deduplicated across runs and triaged in one place, right next to the Snyk, Semgrep and CodeQL results, that's mostly the case of the current project.

One subtlety worth knowing before you ship it: with `advanced-security: true` (the default) zizmor **reports** but never gates — the job stays green and the alerts accumulate in the Security tab. With `advanced-security: false` the action skips the upload and instead fails the job on findings, using zizmor's exit codes (`13` for a highest-severity medium, `14` for high). Depending on how strict you want the pipeline, you'll want one or the other in production — or both, as separate jobs.

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

## What it actually caught on day one

I could stop here and you'd get the idea — but the tool is much more convincing when it catches *you*. So here are two real findings from the first run of my own pipeline, reproduced verbatim.

The first one is the humbling kind. Every action in my workflow was SHA-pinned with a version comment, which I honestly considered a finished, best-practice setup. Zizmor disagreed:

```text
warning[ref-version-mismatch]: action's hash pin has mismatched or missing version comment
  --> ./.github/workflows/ci-cd-pipeline-parallel.yml:46:74
   |
46 |       uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 #v7
   |             -----------------------------------------------------------  ^^ tag points to commit 949feb2413d6
   |             |
   |             is pointed to by tag v7.0.0
   |
   = note: audit confidence → High
   = note: this finding has an auto-fix
```

What it caught: the `#v7` comment claims the hash resolves to `v7`, but the `v7` tag now points to a *different* commit — the maintainers published a patch release, my pin stayed on the old one, and the comment quietly became a lie. Not exploitable by itself, but it means the `#v7` annotation you rely on when reviewing a diff is describing an action that no longer exists. This is exactly the class of "structural drift" that no runtime scanner will ever see, because at runtime the pin still works fine.

The second one is more direct — a plain tag pin that slipped into the file:

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

Note the wording: *(required by blanket policy)* — zizmor treats hash pinning as a repo-wide policy, not a suggestion. And since this was the highest-severity finding, the job itself failed with exit code `14`, the code the tool reserves for "at least one high-severity finding". The severity scale isn't just decoration; it's what turns the linter into a gate.

Both findings ship with auto-fixes (`--fix` applies the safe ones in place), and both link to a documentation page explaining the attack scenario and the recommended resolution.

## What zizmor is *not*

 Zizmor audits **workflow and action definitions only**. It doesn't analyze the scripts they reference, doesn't execute anything, and can't reason about values that only exist at runtime, a build matrix generated by a previous job, for instance. Where things are unknowable statically, it errs on the side of flagging rather than staying silent.

It does a better job paired with another SAST, configured with proper rules for the scripts.

## Closing thoughts

The pitch, really, is this: I had a pipeline I considered hardened — pinned actions, least-privilege jobs, SARIF everywhere — and zizmor still found nine things worth fixing in its first two minutes, without ever running a single line of my code. The next time you're about to write custom linting rules for your workflows, run `zizmor .` first. Someone has probably already built it, and they built it well.
