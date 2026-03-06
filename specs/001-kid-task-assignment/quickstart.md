# Quickstart: Multi-Kid Task Board

## Goal

Implement and validate kid management + kid-task assignment while preserving one
weekly board UX and paper-based completion workflow.

## 1. Prepare environment

1. Ensure `.env` exists (copy from `.env.example` if needed).
2. Start PostgreSQL: `npm run db:up`
3. Run app in dev mode: `npm run dev`

## 2. Implement shared contracts first

1. Extend shared schema for `kids` and `task_assignments`.
2. Add Zod input schemas for kid create/update and assignment replacement.
3. Extend shared route contracts for kid CRUD and assignment endpoints.

## 3. Implement backend

1. Add storage methods for kids and assignments.
2. Add route handlers with input validation and explicit 4xx error responses.
3. Add migration/seed logic to create a default kid and assign legacy tasks.

## 4. Implement frontend

1. Add kid selector to keep one board view while switching kid context.
2. Add kid management UI (add/edit/remove).
3. Add assignment UI in task editor for selecting one or more kids.
4. Ensure print view uses selected kid context and remains A4 landscape readable.

## 5. Verify

1. Run type check: `npm run check`
2. API checks:
   - Create/edit/remove kid
   - Assign/unassign kids to a task
   - Fetch tasks filtered by selected kid
3. UI checks:
   - Switch selected kid and confirm assigned tasks change correctly
   - Verify one-board layout remains unchanged
4. Print checks:
   - Print selected kid board
   - Confirm Spanish labels and readable A4 layout

## 6. Out of Scope Guardrail

- Do not add new digital completion persistence behavior in this feature.
- Completion remains paper-based for household tracking.
