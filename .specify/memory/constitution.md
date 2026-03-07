<!--
Sync Impact Report
- Version change: template (unversioned) -> 1.0.0
- Modified principles:
  - Principle 1 placeholder -> I. Shared Contract-First Design
  - Principle 2 placeholder -> II. Print-Ready and Spanish-First Experience
  - Principle 3 placeholder -> III. Type-Safe Boundaries and Validation
  - Principle 4 placeholder -> IV. Persistent Data Integrity
  - Principle 5 placeholder -> V. Verification as a Delivery Gate
- Added sections:
  - Operational Constraints
  - Delivery Workflow and Quality Gates
- Removed sections: None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ⚠ pending: .specify/templates/commands/*.md (directory not present in repository)
- Follow-up TODOs: None
-->
# Weekly Duty Board Constitution

## Core Principles

### I. Shared Contract-First Design
All API and data model changes MUST be defined in shared contracts before
implementation. `shared/routes.ts` and `shared/schema.ts` are the source of truth
for request/response shapes and persisted entities, and client/server changes MUST
stay synchronized in the same feature scope. This prevents contract drift and keeps
the stack type-safe end-to-end.

### II. Print-Ready and Spanish-First Experience
Any change that affects user-facing behavior MUST preserve weekly usability in both
screen and printed A4 landscape formats. Interface text MUST remain Spanish unless
the requirement explicitly states otherwise, and weekly board interactions MUST stay
clear for low-friction household use. This protects the project’s primary use case:
a fridge-ready weekly responsibility board.

### III. Type-Safe Boundaries and Validation
Boundary inputs MUST be validated with Zod (or stricter equivalent) at API edges,
and TypeScript compilation MUST pass without suppressing errors. New endpoints,
query parameters, and mutations MUST reject malformed data with explicit 4xx
responses. This ensures predictable behavior and reduces regressions from invalid
input states.

### IV. Persistent Data Integrity
Task definitions and completion records MUST maintain stable identifiers and
deterministic date handling (`YYYY-MM-DD` for day-level operations). Schema or seed
changes MUST include compatibility reasoning and a data migration/reset approach for
local Docker Postgres environments. This protects weekly history accuracy and
prevents silent data corruption.

### V. Verification as a Delivery Gate
Changes are not complete until verification evidence is produced. Every feature MUST
include a defined validation plan covering: type checking, affected API behavior, and
UI/print behavior when relevant. If automated tests are absent, manual verification
steps MUST be documented in the spec/tasks artifacts before merge. This keeps
quality enforceable even in a lightweight project workflow.

## Operational Constraints

- Runtime stack MUST remain TypeScript across client, server, and shared contracts.
- PostgreSQL is the required persistence layer for production-like behavior.
- Docker-based local DB workflows (`db:up`, `db:down`, `db:reset`) MUST remain
  functional for contributors.
- The visual theme and readability standards for the weekly board MUST be preserved;
  changes that reduce legibility in print are non-compliant.

## Delivery Workflow and Quality Gates

1. Specifications MUST define independently testable user stories and acceptance
   scenarios before implementation tasks are generated.
2. Implementation plans MUST pass Constitution Check gates before research/design
   proceed and MUST be re-validated after design updates.
3. Tasks MUST be organized by user story with explicit paths and include verification
   tasks tied to constitutional principles (contracts, validation, print/UX, and
   data integrity where applicable).
4. Before completion, contributors MUST run `npm run check` and execute documented
   manual checks for any affected API/UI print flows.

## Governance

This constitution overrides conflicting local workflow conventions in this repository.
Amendments require: (1) a documented rationale, (2) explicit updates to affected
templates under `.specify/templates/`, and (3) a version update following semantic
versioning policy.

Versioning policy:
- MAJOR: Removes or fundamentally redefines a principle or governance requirement.
- MINOR: Adds a principle/section or materially expands required practices.
- PATCH: Clarifies wording without changing normative requirements.

Compliance review expectations:
- Every implementation plan MUST include a Constitution Check section mapped to these
  principles.
- Every specification and task list MUST demonstrate alignment with the active
  principles or explicitly justify temporary exceptions.
- Exceptions are time-limited and MUST include a follow-up remediation task.

**Version**: 1.0.0 | **Ratified**: 2026-03-05 | **Last Amended**: 2026-03-05
