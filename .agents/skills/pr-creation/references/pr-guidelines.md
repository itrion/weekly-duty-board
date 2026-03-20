# PR Guidelines

Use these guidelines to improve the draft, but prefer concrete repo evidence over boilerplate.

## Title

- Keep the title concise and descriptive.
- Use `[Type]: Brief description` when it fits the repo history.
- Common types: `Feature`, `Bugfix`, `Refactor`, `Docs`, `Chore`.
- Derive the title from the aggregate change, not from a minor follow-up commit.

## Description

- Explain what changed in terms of product or system behavior.
- Explain why the change was needed.
- Call out important implementation areas only when they help reviewers.

## Scope

- If the branch mixes multiple concerns, acknowledge that clearly in the PR body.
- If the branch is larger than ideal, help the reviewer by grouping the changes.

## Validation

- Only include checks you actually ran.
- Mark missing scripts as "not defined".
- Do not imply that tests, lint, screenshots, or manual QA happened unless they did.

## Breaking Changes

- Only mark breaking changes when the diff clearly changes contracts, schemas, setup, or behavior that callers depend on.
- If there are no breaking changes, say so plainly.

## Related Work

- Reference issues, PRs, or discussions only when you have a real identifier.
- Do not leave placeholder issue references in the final PR body.

## Reviewer Help

- Include brief review notes when the branch is large, risky, or spans backend and frontend work.
- Call out follow-up work or known gaps separately from validated behavior.
