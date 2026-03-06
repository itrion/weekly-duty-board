# Tasks: Multi-Kid Task Board

**Input**: Design documents from `/specs/001-kid-task-assignment/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are not explicitly requested in the feature specification.
**Verification**: Constitution-aligned verification tasks are REQUIRED for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared structure and documentation artifacts used by all stories.

- [ ] T001 Create database migration script for `kids` and `task_assignments` in `server/db.ts`
- [ ] T002 [P] Document migration/backfill steps for default kid in `specs/001-kid-task-assignment/quickstart.md`
- [ ] T003 [P] Add feature API contract notes for implementers in `specs/001-kid-task-assignment/contracts/multi-kid-api.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contract and data infrastructure that MUST be complete before any user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Add `kids` and `task_assignments` table schemas and types in `shared/schema.ts`
- [ ] T005 Add Zod schemas for kid CRUD and assignment payloads in `shared/schema.ts`
- [ ] T006 Update shared API route contracts for kid endpoints and task assignment endpoint in `shared/routes.ts`
- [ ] T007 Implement storage interface methods for kids and task assignments in `server/storage.ts`
- [ ] T008 Implement kid and assignment API handlers with validation/error responses in `server/routes.ts`
- [ ] T009 Implement default-kid backfill for existing tasks in `docker/postgres/init/01-init.sql`
- [ ] T010 Add query key/helpers for kid-scoped task retrieval in `client/src/lib/queryClient.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Manage Kids List (Priority: P1) 🎯 MVP

**Goal**: Parent can create, edit, list, and remove kids.

**Independent Test**: Add two kids, edit one name, and remove one kid while keeping the list accurate.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Add kid API hooks (`list/create/update/delete`) in `client/src/hooks/use-tasks.ts`
- [ ] T012 [P] [US1] Create kid management UI section in `client/src/components/TaskEditorSheet.tsx`
- [ ] T013 [US1] Integrate kid management actions into Home screen flow in `client/src/pages/Home.tsx`
- [ ] T014 [US1] Add duplicate-name and empty-name validation messages in `client/src/components/ui/input.tsx`
- [ ] T015 [US1] Document manual verification steps for kid CRUD in `specs/001-kid-task-assignment/quickstart.md`

**Checkpoint**: User Story 1 is independently functional and demoable.

---

## Phase 4: User Story 2 - Assign Tasks Per Kid (Priority: P2)

**Goal**: Parent can assign/unassign tasks to one or more kids independently.

**Independent Test**: Assign a task to kid A only, then to kid A and kid B, and verify assignment changes persist correctly.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Add assignment update API hook for `/api/tasks/{taskId}/assignments` in `client/src/hooks/use-tasks.ts`
- [ ] T017 [P] [US2] Add multi-kid assignment controls to task editor in `client/src/components/TaskEditorSheet.tsx`
- [ ] T018 [US2] Persist assignment changes from UI to API in `client/src/pages/Home.tsx`
- [ ] T019 [US2] Ensure assignment integrity checks for duplicate pairs in `server/storage.ts`
- [ ] T020 [US2] Document assignment verification steps in `specs/001-kid-task-assignment/quickstart.md`

**Checkpoint**: User Stories 1 and 2 both function independently.

---

## Phase 5: User Story 3 - Keep One Simple Weekly Board (Priority: P3)

**Goal**: Maintain one board layout while switching selected kid context and print output per selected kid.

**Independent Test**: Switch selected kid and confirm board remains the same layout but shows that kid's assigned tasks; print selected kid board.

### Implementation for User Story 3

- [ ] T021 [P] [US3] Add selected-kid state and board context wiring in `client/src/pages/Home.tsx`
- [ ] T022 [P] [US3] Add kid selector UI for board context in `client/src/components/WeeklyTable.tsx`
- [ ] T023 [US3] Apply kid filter to task list queries and rendering in `client/src/hooks/use-tasks.ts`
- [ ] T024 [US3] Ensure print output reflects selected kid in `client/src/pages/Home.tsx`
- [ ] T025 [US3] Document print and kid-switch manual verification in `specs/001-kid-task-assignment/quickstart.md`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks and documentation alignment across stories.

- [ ] T026 [P] Update API endpoint summary and feature behavior in `README.md`
- [ ] T027 Reconcile contract and implementation naming consistency in `shared/routes.ts`
- [ ] T028 Run type validation and fix issues via `npm run check` in `package.json`
- [ ] T029 Run end-to-end manual verification checklist in `specs/001-kid-task-assignment/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Story Phases (Phase 3-5)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on US2/US3.
- **US2 (P2)**: Starts after Foundational; depends on kid entities from US1 outputs for meaningful use.
- **US3 (P3)**: Starts after Foundational; depends on US1 kid management and US2 assignment behavior.

### Dependency Graph

- `Setup -> Foundational -> US1 -> US2 -> US3 -> Polish`

---

## Parallel Execution Opportunities

- **Phase 1**: T002 and T003 can run in parallel.
- **Phase 2**: T005 and T006 can run in parallel after T004; T010 can run in parallel with backend tasks.
- **US1**: T011 and T012 can run in parallel.
- **US2**: T016 and T017 can run in parallel.
- **US3**: T021 and T022 can run in parallel.
- **Polish**: T026 and T028 can run in parallel.

### Parallel Example: User Story 1

```bash
Task: "T011 [US1] Add kid API hooks in client/src/hooks/use-tasks.ts"
Task: "T012 [US1] Create kid management UI section in client/src/components/TaskEditorSheet.tsx"
```

### Parallel Example: User Story 2

```bash
Task: "T016 [US2] Add assignment update API hook in client/src/hooks/use-tasks.ts"
Task: "T017 [US2] Add multi-kid assignment controls in client/src/components/TaskEditorSheet.tsx"
```

### Parallel Example: User Story 3

```bash
Task: "T021 [US3] Add selected-kid state in client/src/pages/Home.tsx"
Task: "T022 [US3] Add kid selector UI in client/src/components/WeeklyTable.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate kid CRUD end-to-end.
4. Demo/review before adding assignment and board-context enhancements.

### Incremental Delivery

1. Deliver US1 (kid management).
2. Deliver US2 (kid-task assignment).
3. Deliver US3 (single-board kid context + print behavior).
4. Complete polish and final verification.

### Validation Notes

- All tasks follow required checklist format: checkbox, Task ID, optional `[P]`, required `[USx]` for story phases, and explicit file path.
- Each user story includes independent test criteria and can be validated incrementally.
