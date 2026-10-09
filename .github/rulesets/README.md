# Branch protection as code

GitHub enforces branch protection when changes are merged; a workflow only
reports status checks. Keeping the ruleset definition in `main.json` makes the
intended policy reviewable alongside the required `ci-gate`. The server-side
rule matters because a PR can otherwise change its workflow and weaken its own
checks in the same diff.

`main.json` describes the intended ruleset; checking it in does not apply it or
confirm that the same settings are enabled in GitHub.

## Apply it

Authenticate the GitHub CLI with an account or token that has **admin** rights
on the repository. The workflow's built-in `GITHUB_TOKEN` cannot apply the
ruleset; use a fine-grained PAT with *Repository permissions → Administration:
Read and write*, or a GitHub App installation token.

```bash
set -euo pipefail
REPO=aminebnz02-cpu/Blog0xab
RULESET_ID=$(gh api "repos/$REPO/rulesets" \
  --jq '.[] | select(.name == "protect-main") | .id')

if [ -n "$RULESET_ID" ]; then
  gh api -X PUT "repos/$REPO/rulesets/$RULESET_ID" \
    --input .github/rulesets/main.json
else
  gh api -X POST "repos/$REPO/rulesets" \
    --input .github/rulesets/main.json
fi
```

Set `"enforcement": "evaluate"` for a dry run: rules are checked and reported
on the ruleset insights page but nothing is blocked. This can confirm the
required check name before enforcement. Restore `"active"` and apply the file
again to enforce the rules.

## What each rule buys you

| Rule | Effect |
|---|---|
| `deletion`, `non_fast_forward` | `main` cannot be deleted or force-pushed. |
| `required_linear_history` | No merge commits; paired with `allowed_merge_methods: ["squash"]`, each commit on `main` represents one reviewed PR. |
| `pull_request` | Direct pushes to `main` are rejected, so changes go through review and CI. |
| `required_status_checks` | `ci-gate` must pass before merging. |
| `strict_required_status_checks_policy` | The branch must be up to date with `main` before merging. |
| `required_review_thread_resolution` | Unresolved review comments block merging. |

### Deliberate choices

- **`required_approving_review_count: 0`.** A solo maintainer cannot approve
  their own PR. Requiring one approval would make `main` unmergeable; raise this
  to one when there is a second maintainer.
- **`bypass_actors: []`.** No standing bypass is configured. For an emergency,
  temporarily changing enforcement leaves a trace in the ruleset audit history.
- **`integration_id: 15368`** scopes the `ci-gate` context to GitHub Actions.
  Drop it if another CI provider reports the required check.
- **Signed commits are not required.** Add that rule only after commit signing
  is configured for maintainers.

## Why `ci-gate`

Required checks are matched by name. Requiring every upstream job means each
rename or split needs a corresponding settings change, and a removed job can
leave a required check that never arrives. The aggregate job keeps the fan-in
in the reviewed workflow.
