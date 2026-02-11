# Replit Agent Guide

## Overview

This is a **weekly responsibility tracker** designed for a 15-year-old with ADHD. It displays a weekly table of daily and weekly tasks (homework, chores, backpack prep, etc.) that can be checked off, with a gamification points system to encourage completion. The app is designed to be printable in A4 landscape format for posting on a fridge. The UI language is Spanish.

Key features:
- Weekly task grid with toggleable completion checkboxes
- Points/gamification system with progress levels
- Week navigation (previous/next week)
- Print-optimized layout (A4 landscape)
- Auto-seeding of default tasks if the database is empty
- Task reset functionality

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state (fetch, cache, mutations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming. Theme color is "Petrol Green" (`#006D77`).
- **Fonts**: Inter (body), Outfit (headings) via Google Fonts
- **Icons**: Lucide React
- **Date handling**: date-fns with Spanish locale (`es`)
- **Build tool**: Vite with React plugin
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

### Backend
- **Runtime**: Node.js with TypeScript (tsx for dev, esbuild for production)
- **Framework**: Express 5
- **API pattern**: RESTful JSON API under `/api/` prefix
- **Route definitions**: Shared route definitions in `shared/routes.ts` with Zod schemas for input validation and response typing — used by both client and server
- **Dev server**: Vite dev server middleware integrated into Express for HMR

### Data Storage
- **Database**: PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod conversion
- **Schema location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command (push-based, no migration files needed for dev)
- **Tables**:
  - `tasks` — stores task definitions (title, time info, type daily/weekly, required days as JSONB array, icon name, points value)
  - `completions` — stores task completion records (task ID, date as `YYYY-MM-DD` string, completed boolean)

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/tasks` | List all tasks (auto-seeds if empty) |
| POST | `/api/tasks/reset` | Reset tasks to default seed data |
| GET | `/api/completions?startDate=&endDate=` | Get completions for date range |
| POST | `/api/completions` | Toggle a task's completion status |

### Project Structure
```
client/           → React frontend
  src/
    components/   → App components (WeeklyTable, PointsDisplay)
    components/ui/→ shadcn/ui component library
    hooks/        → Custom hooks (use-tasks, use-mobile, use-toast)
    lib/          → Utilities (queryClient, utils)
    pages/        → Page components (Home, not-found)
server/           → Express backend
  index.ts        → Server entry point
  routes.ts       → API route handlers
  storage.ts      → Database storage layer (implements IStorage interface)
  db.ts           → Drizzle/PostgreSQL connection
  vite.ts         → Vite dev middleware setup
  static.ts       → Production static file serving
shared/           → Code shared between client and server
  schema.ts       → Drizzle database schema + Zod types
  routes.ts       → API route contracts (paths, methods, Zod schemas)
```

### Key Design Decisions
- **Shared schema and routes**: The `shared/` directory contains both the database schema and API route contracts, ensuring type safety across the full stack
- **Storage interface pattern**: `IStorage` interface in `storage.ts` abstracts database operations, making it possible to swap implementations
- **Auto-seeding**: Tasks are automatically seeded on first GET request if the database is empty
- **Date strings**: Completions use `YYYY-MM-DD` string format for dates rather than timestamp columns, simplifying day-level queries
- **Print support**: CSS `@media print` rules are critical — the app is designed to be printed and posted on a fridge

## External Dependencies

- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable. Used with `pg` (node-postgres) driver and Drizzle ORM.
- **Google Fonts**: Inter, Outfit, DM Sans, Fira Code, Geist Mono, Architects Daughter loaded via CDN
- **No authentication**: The app currently has no auth system — it's a simple family tool
- **Replit plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` used in development