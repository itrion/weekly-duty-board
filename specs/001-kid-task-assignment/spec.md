# Feature Specification: Multi-Kid Task Board

**Feature Branch**: `001-kid-task-assignment`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "My middle boy got interested on using the board as well so, although following the same principles as for my ADHD son, this wont be related to him only. We need to support different \"Kids\" so I can add kids and assign their tasks independently. Id like to keep it simple and it is important that we have only one"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Kids List (Priority: P1)

As a parent, I can add and edit kids so the board is no longer limited to one child.

**Why this priority**: Without kid management, independent assignment is not possible.

**Independent Test**: Add two kids, edit one kid's name, and confirm both kids appear correctly in the board context.

**Acceptance Scenarios**:

1. **Given** no kids exist, **When** the parent adds a kid with a valid name, **Then** the kid appears in the kids list and can be selected.
2. **Given** a kid already exists, **When** the parent updates the kid name, **Then** the updated name is shown everywhere that kid appears.
3. **Given** a duplicate kid name is entered, **When** the parent tries to save, **Then** the system prevents duplicates and shows a clear message.

---

### User Story 2 - Assign Tasks Per Kid (Priority: P2)

As a parent, I can assign tasks to specific kids so each child has an independent responsibility plan.

**Why this priority**: This is the core value requested: independent task assignment per kid.

**Independent Test**: Assign different tasks to two kids and verify each kid only shows their assigned tasks in the weekly board.

**Acceptance Scenarios**:

1. **Given** multiple kids exist, **When** the parent assigns a task to one kid, **Then** only that kid has that assignment.
2. **Given** a task can apply to multiple kids, **When** the parent selects multiple kids for that task, **Then** each selected kid receives that assignment independently.
3. **Given** an existing assignment, **When** the parent unassigns the task from one kid, **Then** that kid no longer sees the task while others remain unchanged.

---

### User Story 3 - Keep One Simple Weekly Board (Priority: P3)

As a parent, I can keep a single weekly board view while still tracking each kid separately, so daily use stays simple.

**Why this priority**: The user asked to keep the experience simple and maintain one board concept.

**Independent Test**: Open the weekly board, switch kid context, and confirm the same board layout is preserved while content changes per selected kid.

**Acceptance Scenarios**:

1. **Given** at least two kids with assignments, **When** the parent switches from kid A to kid B, **Then** the same weekly board layout remains and only kid-specific assigned tasks change.
2. **Given** print view is used, **When** the parent prints for a selected kid, **Then** the printed board shows only that kid's assignments for the selected week.

### Edge Cases

- What happens when a parent tries to remove a kid who already has task history?
- How does the system handle a task with no assigned kids?
- How does the board behave when no kid is selected yet?
- What happens if two kids have very similar names?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the parent to create, view, update, and remove kid profiles.
- **FR-002**: System MUST enforce unique kid names within the same household board.
- **FR-003**: Parent MUST be able to assign each task to one or more kids.
- **FR-004**: System MUST keep completion tracking out of digital scope and support paper-based checking on printed boards.
- **FR-005**: System MUST present one weekly board experience that can be switched to a selected kid without changing layout.
- **FR-006**: System MUST let the parent view and print a kid-specific weekly board.
- **FR-007**: System MUST preserve existing single-kid data by associating it to a default kid during transition.
- **FR-008**: System MUST prevent task assignment records from being mixed across kids.
- **FR-009**: System MUST show clear feedback when assignment or kid management actions fail.

### Constitution Alignment *(mandatory)*

- **CA-001 Contract Impact**: Shared task, kid, and assignment definitions are updated together so all app layers use the same meaning.
- **CA-002 Print and Language Impact**: The weekly board remains A4 landscape friendly and all user-facing text remains Spanish.
- **CA-003 Validation Boundaries**: Kid creation/editing and task assignment updates validate user input and reject invalid entries with clear errors.
- **CA-004 Data Integrity**: Task assignments stay tied to the correct kid and remain consistent during migration from one-kid to multi-kid mode.
- **CA-005 Verification Evidence**: Delivery includes typecheck evidence plus documented checks for kid management, assignment behavior, and print output.

### Key Entities *(include if feature involves data)*

- **Kid**: Represents a child on the board, with a unique display name and active status.
- **Task Assignment**: Represents the relationship between a task and one or more kids.
- **Board Context**: Represents the selected kid and selected week used to display a single board view.

## Assumptions

- The system remains a single-family board managed by one parent context.
- "Only one" is interpreted as one shared weekly board experience, not separate board apps per kid.
- Existing tasks stay reusable; only assignment ownership changes.
- Task completion remains paper-based on the printed board and is not digitally persisted in this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent can add a new kid and assign at least 5 tasks in under 3 minutes.
- **SC-002**: In user validation, 100% of tested kid switches show only the selected kid's assigned tasks.
- **SC-003**: At least 90% of weekly task updates are completed without needing clarification from the parent about which kid owns a task.
- **SC-004**: Printed weekly boards for selected kids are readable and usable in at least 95% of print checks.
