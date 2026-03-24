---
name: pr-creation
description: '**WORKFLOW SKILL** — Open a pull request from the current branch: validate available checks, confirm branch state against `main`, draft a concrete PR description from the actual diff, and create/open the PR with GitHub CLI. USE FOR: opening a PR after development work is ready. DO NOT USE FOR: code review, unrelated git tasks, or branches with failing required checks.'
---

# PR Creation Skill

Open a PR from the current branch using repository evidence, not placeholders. The skill should leave the user with a real GitHub PR or a concrete blocker.

Read `references/pr-guidelines.md` if you need PR-writing guidance or section expectations. Read `assets/pr-template.md` when drafting the PR body.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated (`gh auth login`)
- Current branch has commits ready for PR
- Not on main/master branch
- Project scripts may vary; detect what exists from `package.json` instead of assuming `lint` or `test`

## Workflow Steps

### 1. Branch and Repository Validation

- Confirm current branch is not main/master
- Fetch latest changes from origin
- Confirm the branch is ahead of `origin/main`
- Check whether a PR for the current branch already exists before creating a new one

### 2. Code Quality Validation

Run checks based on scripts that actually exist in `package.json`. Use this default order:

- `npm run check`
- `npm run lint`
- `npm test`
- `npm run build`

Rules:

- Skip missing scripts and record them as "not defined"
- Stop on failures for scripts that do exist
- Record the actual outcome of each attempted check for the PR body
- Do not claim manual testing, screenshots, review, or readiness unless verified

### 3. Branch Update

- If the branch is behind `origin/main`, update it before opening the PR
- Prefer a non-destructive update path consistent with the repo's current history
- If merge conflicts occur, prompt user to resolve manually
- Push the updated branch only if local commits are not already on the remote tracking branch

### 4. PR Drafting

- Draft from the aggregate diff against `origin/main`, not just the latest commit message
- Use the template in `assets/pr-template.md`, but replace placeholders with concrete content
- Summarize the actual behavior change, why it was needed, and the main implementation areas
- Infer related issues only when commit messages or branch context provide real references
- Note breaking changes only when the diff supports that claim
- Skip screenshots unless they are actually available or clearly needed
- Replace the old generic checklist with evidence-based sections:
  - `Validation`
  - `Risks / Follow-ups`
  - `Review Notes`

### 5. PR Submission

- If a PR already exists for the branch, report it and open it instead of creating another
- Otherwise use `gh pr create` with the drafted title/body
- Open the resulting PR in the browser

## Error Handling

- **Test Failures**: Report which checks failed and suggest fixes
- **Merge Conflicts**: Provide instructions for manual resolution
- **Authentication Issues**: Guide user to `gh auth login`
- **Missing Scripts**: Record them accurately; do not treat them as failures
- **Network/Sandbox Issues**: Retry GitHub commands with the necessary permissions before concluding auth is broken

## Resources

- `assets/pr-template.md`: Standardized PR description template following best practices
- `references/pr-guidelines.md`: Bundled PR-writing guidance for this workflow

## Usage Example

Invoke with: `/pr-creation`

The skill should validate, draft, create, and open the PR autonomously unless it hits a real blocker.
