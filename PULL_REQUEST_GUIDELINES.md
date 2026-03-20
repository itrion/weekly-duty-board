# Pull Request Best Practices and Template

## Best Practices for Opening a Pull Request

### 1. Clear and Descriptive Title
- Use a concise title that summarizes the change
- Follow the format: `[Type]: Brief description`
- Common types: `Feature`, `Bugfix`, `Refactor`, `Docs`, `Chore`, etc.
- Example: `Feature: Add user authentication system`

### 2. Detailed Description
- Explain what the PR does and why it's needed
- Provide context and motivation for the change
- Mention any breaking changes or dependencies
- Reference related issues, PRs, or discussions

### 3. Small and Focused Changes
- Keep PRs small to make code review easier
- Aim for one feature or bug fix per PR
- Avoid mixing unrelated changes (e.g., don't combine a feature with refactoring)
- If a PR grows too large, consider splitting it

### 4. Include Tests
- Add or update unit tests, integration tests, and end-to-end tests
- Ensure all existing tests still pass
- Include manual testing steps in the description
- Test edge cases and error scenarios

### 5. Code Quality and Standards
- Follow the project's coding standards and style guidelines
- Ensure code is well-documented with comments where needed
- Remove any debug code, console logs, or temporary files
- Run linters and formatters before submitting

### 6. Documentation Updates
- Update README, API docs, or inline documentation if needed
- Include migration guides for breaking changes
- Update CHANGELOG or release notes if applicable

### 7. Request Reviews Appropriately
- Assign reviewers who are familiar with the codebase or feature area
- Provide review guidelines or specific areas to focus on
- Be responsive to feedback and iterate on the PR

### 8. Use Labels, Milestones, and Draft Status
- Apply relevant labels (e.g., `enhancement`, `bug`, `breaking-change`)
- Associate with milestones or sprints if applicable
- Use draft PR status for work-in-progress changes

### 9. Branch Naming
- Use descriptive branch names following the project's convention
- Example: `feature/add-user-auth`, `bugfix/fix-login-issue`

### 10. Commit Messages
- Write clear, descriptive commit messages
- Use present tense and imperative mood
- Reference issue numbers when applicable

## Pull Request Template

Use this template as a starting point for your PR description:

```

## Title
[Type]: Brief description of the change

## Description
### What does this PR do?
- Detailed explanation of the changes made

### Why is this change needed?
- Motivation, context, and reasoning for the change

### How was this tested?
- Description of testing approach
- Commands to run tests: `npm test`, `npm run lint`
- Manual testing steps performed
- Test coverage information

### Breaking Changes
- List any breaking changes introduced
- Migration instructions for users
- Deprecation notices if applicable

### Related Issues & PRs
- Closes #123
- Related to #456
- Supersedes #789

### Screenshots/Videos (if applicable)
- Add screenshots or videos for UI/UX changes
- Before/after comparisons

### Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Reviewed by at least one team member
- [ ] Ready for merge

### Additional Notes
- Any additional context or considerations
- Performance implications
- Security considerations
- Future improvements or follow-up work

```

## Additional Tips
- Keep the PR open for a reasonable time to allow for thorough review
- Be open to feedback and willing to make changes
- Use the PR as an opportunity to share knowledge with the team
- If the PR becomes stale, ping reviewers or update with new commits
- Consider using tools like GitHub's "Request changes" or "Approve" features for clear communication