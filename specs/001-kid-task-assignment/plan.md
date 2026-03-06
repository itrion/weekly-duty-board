# Implementation Plan: Multi-Kid Task Board

**Branch**: `001-kid-task-assignment` | **Date**: 2026-03-05 | **Spec**: [/Users/johan/code/Weekly-Duty-Board/specs/001-kid-task-assignment/spec.md](/Users/johan/code/Weekly-Duty-Board/specs/001-kid-task-assignment/spec.md)
**Input**: Feature specification from `/specs/001-kid-task-assignment/spec.md`

## Summary

Enable a single weekly board to support multiple kids by introducing kid profiles and
kid-to-task assignment, while keeping completion tracking out of this feature scope
(paper checks remain the source of completion truth).

## Technical Context

**Language/Version**: TypeScript (Node.js + React, repository standard)  
**Primary Dependencies**: Express, React, TanStack Query, Drizzle ORM, Zod  
**Storage**: PostgreSQL via Drizzle (`DATABASE_URL`)  
**Testing**: `npm run check` (TypeScript compile checks) + manual API/UI/print verification  
**Target Platform**: Web app (desktop/mobile browser) + A4 print output  
**Project Type**: Full-stack web application (client + server + shared contracts)  
**Performance Goals**: Kid switch and assignment updates visible in under 1 second in normal home usage  
**Constraints**: Single shared board UX, Spanish UI text, A4 landscape print readability, no digital completion expansion in this feature  
**Scale/Scope**: One household, small number of kids and tasks (single digits to low tens)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Contract-First Gate**: PASS. Plan includes synchronized updates in `shared/schema.ts`,
  `shared/routes.ts`, `server/routes.ts`, `server/storage.ts`, and client hooks/views.
- **Print + Language Gate**: PASS. Single-board layout is preserved; kid context is added
  without changing print-first intent; user-facing copy remains Spanish.
- **Validation Gate**: PASS. Kid create/edit and task assignment inputs will be validated
  with Zod and return explicit 4xx errors for invalid data.
- **Data Integrity Gate**: PASS. Existing tasks will be linked to a default kid during
  migration; assignment records are isolated by `kidId`; no completion-model expansion.
- **Verification Gate**: PASS. Verification includes `npm run check`, API contract checks,
  kid switching UI checks, and print output checks.

## Project Structure

### Documentation (this feature)

```text
specs/001-kid-task-assignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── multi-kid-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
client/
└── src/
    ├── components/
    ├── hooks/
    └── pages/

server/
├── routes.ts
├── storage.ts
└── db.ts

shared/
├── schema.ts
└── routes.ts

docker/postgres/init/
└── 01-init.sql
```

**Structure Decision**: Use the existing full-stack layout (`client/`, `server/`, `shared/`)
and extend shared contracts first, then server storage/routes, then client kid-context UX.

## Phase 0: Research Plan

1. Decide canonical data model for kid-task assignment while keeping one board UX.
2. Decide migration strategy from current single-kid data to default kid ownership.
3. Decide API contract shape for kid CRUD and assignment updates.
4. Decide print behavior for selected kid context without digital completion scope changes.

## Phase 1: Design Plan

1. Produce `data-model.md` with entities, validation rules, and migration notes.
2. Produce `contracts/multi-kid-api.yaml` for kid and assignment interfaces.
3. Produce `quickstart.md` with implementation and verification flow.
4. Re-check constitution gates after design artifacts are finalized.

## Post-Design Constitution Re-Check

- **Contract-First Gate**: PASS. `contracts/multi-kid-api.yaml` and data model define a
  clear shared contract before implementation.
- **Print + Language Gate**: PASS. Design keeps one board with kid selector and
  kid-specific print output; Spanish-first text remains required.
- **Validation Gate**: PASS. Validation rules are specified for kid name and assignment
  payloads.
- **Data Integrity Gate**: PASS. Default-kid migration and assignment uniqueness rules are
  explicitly documented.
- **Verification Gate**: PASS. Quickstart includes typecheck + manual API/UI/print checks.

## Complexity Tracking

No constitution violations or exceptional complexity requiring justification.
