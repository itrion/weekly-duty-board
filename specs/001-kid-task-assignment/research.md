# Phase 0 Research: Multi-Kid Task Board

## Decision 1: Model kid-task ownership with a join table

- **Decision**: Introduce a `kids` entity and a many-to-many `task_assignments` entity
  (`task_id`, `kid_id`) instead of embedding kid ownership directly in `tasks`.
- **Rationale**: Requirements allow one task to be assigned to one or more kids while
  preserving reusable task definitions.
- **Alternatives considered**:
  - Add `kid_id` directly on `tasks` (rejected: cannot support multi-kid assignment).
  - Duplicate tasks per kid (rejected: higher maintenance and data drift risk).

## Decision 2: Keep completion tracking out of digital scope

- **Decision**: Do not add kid-scoped completion persistence in this feature.
- **Rationale**: The feature explicitly states completion is managed on paper with
  checkmarks; scope is kid management + assignment + one-board filtering.
- **Alternatives considered**:
  - Add `kid_id` to completions now (rejected: out of scope and unnecessary complexity).
  - Remove completions immediately (rejected: could break existing behavior unexpectedly).

## Decision 3: Migrate single-kid setup through a default kid record

- **Decision**: On migration, create one default kid record and assign all existing tasks
  to that kid.
- **Rationale**: Preserves current household data and keeps behavior stable after rollout.
- **Alternatives considered**:
  - Leave tasks unassigned initially (rejected: ambiguous first-run behavior).
  - Force user to reassign all tasks manually (rejected: poor UX, avoidable friction).

## Decision 4: Contract shape for kid and assignment management

- **Decision**: Add kid CRUD endpoints and task assignment update endpoint; keep board
  consumption simple by fetching tasks for a selected kid.
- **Rationale**: Supports independent management while fitting current REST-style
  architecture and shared route contract pattern.
- **Alternatives considered**:
  - Single combined endpoint for all actions (rejected: weak validation boundaries).
  - Client-only filtering without server assignment model (rejected: no persistence).

## Decision 5: Preserve one board UX and print behavior

- **Decision**: Keep one weekly board layout; add kid context selector; print output is
  for currently selected kid.
- **Rationale**: Matches the explicit simplicity requirement and existing print-first
  workflow.
- **Alternatives considered**:
  - Separate board per kid screen (rejected: violates "only one board" direction).
  - Multi-kid combined print page (rejected: reduced readability for fridge use).
