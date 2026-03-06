# Data Model: Multi-Kid Task Board

## Entity: Kid

- **Purpose**: Represents a child that can receive task assignments.
- **Fields**:
  - `id` (integer, primary key)
  - `name` (string, required, trimmed, unique within household, 1-60 chars)
  - `active` (boolean, required, default `true`)
  - `createdAt` (timestamp, required)
- **Validation Rules**:
  - Name MUST be non-empty after trim.
  - Name MUST be unique (case-insensitive uniqueness recommended).

## Entity: Task (existing)

- **Purpose**: Reusable task definition shown in the weekly board.
- **Fields used by feature**:
  - `id`, `title`, `type`, `requiredDays`, `points`, `icon`, `timeInfo`
- **Notes**:
  - Task definition remains shared and reusable.
  - Completion fields are unaffected by this feature scope.

## Entity: TaskAssignment

- **Purpose**: Assigns tasks to kids independently.
- **Fields**:
  - `id` (integer, primary key)
  - `taskId` (integer, required, foreign key -> `tasks.id`)
  - `kidId` (integer, required, foreign key -> `kids.id`)
  - `createdAt` (timestamp, required)
- **Constraints**:
  - Unique composite key on (`taskId`, `kidId`) to prevent duplicate assignment.
  - Deleting a kid or task removes dependent assignments.

## Entity: BoardContext (view model)

- **Purpose**: Current selected kid and week used to display one board.
- **Fields**:
  - `selectedKidId` (integer, required)
  - `weekStart` (date string `YYYY-MM-DD`, required)
  - `weekEnd` (date string `YYYY-MM-DD`, required)
- **Notes**:
  - This is a UI/session concept, not necessarily a persisted table.

## Relationships

- `Kid` many-to-many `Task` through `TaskAssignment`.
- `TaskAssignment` belongs to one `Kid` and one `Task`.

## Migration and Integrity Rules

1. Create one default kid row during rollout for existing data.
2. Create one assignment per existing task to the default kid.
3. Preserve all existing tasks unchanged.
4. Do not expand digital completion storage in this feature.
