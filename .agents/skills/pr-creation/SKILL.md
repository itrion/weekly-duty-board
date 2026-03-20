---
name: pr-creation
description: '**WORKFLOW SKILL** — Comprehensive PR creation workflow: validate code quality, update branch with main, draft PR using best practices template, and open via GitHub CLI. USE FOR: opening pull requests following project guidelines after development. DO NOT USE FOR: reviewing PRs, general git operations, or when code doesn't pass checks.'
---

# PR Creation Skill

## Overview

This skill automates the process of opening a pull request following the project's best practices. It ensures code quality, updates the branch, drafts a proper PR description, and submits it via GitHub CLI.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated (`gh auth login`)
- Current branch has commits ready for PR
- Not on main/master branch
- `PULL_REQUEST_GUIDELINES.md` exists in workspace root
- Project scripts available: `npm run check` (TypeScript), and ideally `npm test` and `npm run lint` (add if missing)

## Workflow Steps

### 1. Branch and Repository Validation

- Confirm current branch is not main/master
- Fetch latest changes from origin
- Check if branch is ahead of origin/main

### 2. Code Quality Validation

Run the following checks in sequence. Skip missing scripts with warnings, but stop and report failures for available checks:

- **TypeScript Check**: `npm run check`
- **Linting**: `npm run lint` (skip with warning if not defined)
- **Tests**: `npm test` (skip with warning if not defined)
- **Build**: `npm run build` (to ensure production build works)

### 3. Branch Update

- Merge current branch with origin/main (using merge to preserve history for squash merges)
- If merge conflicts occur, prompt user to resolve manually
- Push the updated branch to origin

### 4. PR Drafting

- Read the PR template from `assets/pr-template.md`
- Infer PR title from the latest commit message (e.g., "feat: add X" → "[Feature]: Add X")
- Infer description by summarizing git diff against origin/main
- Infer related issues from commit messages (e.g., "Closes #123")
- Infer PR labels based on commit types (feat → enhancement, fix → bug, docs → documentation)
- Auto-fill breaking changes by checking for API/schema changes in diff
- Skip screenshots/videos unless explicitly needed (assume none for autonomy)
- Fill in testing section with available scripts and build success

### 5. PR Submission

- Use `gh pr create` with the drafted description and inferred labels
- Open the created PR in browser for review

## Error Handling

- **Test Failures**: Report which checks failed and suggest fixes
- **Merge Conflicts**: Provide instructions for manual resolution
- **Authentication Issues**: Guide user to `gh auth login`
- **Missing Scripts**: Note which scripts are missing and suggest adding them

## Assets

- `assets/pr-template.md`: Standardized PR description template following best practices

## Usage Example

Invoke with: `/pr-creation`

The skill will autonomously validate, update, draft, and open the PR without user input.
