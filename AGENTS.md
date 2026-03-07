# Weekly-Duty-Board Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-05

## Active Technologies

- TypeScript (Node.js + React, repository standard) + Express, React, TanStack Query, Drizzle ORM, Zod (001-kid-task-assignment)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript (Node.js + React, repository standard): Follow standard conventions

## Recent Changes

- 001-kid-task-assignment: Added TypeScript (Node.js + React, repository standard) + Express, React, TanStack Query, Drizzle ORM, Zod

<!-- MANUAL ADDITIONS START -->
- Drizzle DB discipline:
  - `shared/schema.ts` is the schema source of truth.
  - Generate migration SQL from schema diffs (`drizzle-kit generate`) after schema edits.
  - Apply only via migrations (`npm run db:migrate` / `npm run bootstrap`).
  - Keep `schema.ts` and `migrations/*` in the same commit.
  - Do not rely on `db:push` for normal development flow.
<!-- MANUAL ADDITIONS END -->
