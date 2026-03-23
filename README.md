# Replit Agent Guide

## Overview

This is a **weekly responsibility tracker** designed for a 15-year-old with ADHD. It displays a weekly table of daily and weekly tasks (homework, chores, backpack prep, etc.) that can be checked off, with a gamification points system to encourage completion. The app is designed to be printable in A4 landscape format for posting on a fridge. The UI language is Spanish.

Key features:

- Weekly task grid with toggleable completion checkboxes
- Points/gamification system with progress levels
- Week navigation (previous/next week)
- Print-optimized layout (A4 landscape)
- Docker-based Postgres setup with migration-driven initialization

## User Preferences

Preferred communication style: Simple, everyday language.

## Development Governance

- Project constitution: `.specify/memory/constitution.md`
- All feature plans/specs/tasks must satisfy constitution gates for shared contracts,
  print + Spanish UX, boundary validation, data integrity, and verification evidence.
- Minimum verification before merge: `npm run check` plus documented manual checks
  for impacted API/UI/print flows.

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

- **Persistence**: JSON file on local filesystem (`DATA_STORE_PATH`, default `data/store.json`)
- **Storage layer**: `server/storage.ts` (atomic read/write and seeded defaults on first boot)
- **Tables**:
  - Logical entities are still the same (`tasks`, `routines`, `kids`, assignments, completions), but stored in one JSON document.

### API Endpoints

| Method | Path                                   | Purpose                                 |
| ------ | -------------------------------------- | --------------------------------------- |
| POST   | `/api/board-items`                     | Create task/routine and assign kids     |
| GET    | `/api/board-items?kidId=`              | List board items (tasks + routines)     |
| PATCH  | `/api/board-items/:kind/:id`           | Update one task/routine                 |
| PUT    | `/api/board-items/:kind/:id/assignments` | Replace kid assignments for item      |
| GET    | `/api/kids`                            | List kids                               |
| POST   | `/api/kids`                            | Create kid                              |
| PATCH  | `/api/kids/:id`                        | Update kid                              |
| DELETE | `/api/kids/:id`                        | Remove kid                              |
| GET    | `/api/completions?startDate=&endDate=` | Get completions for date range          |
| POST   | `/api/completions`                     | Toggle completion status (task/routine) |

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
  storage.ts      → JSON file storage layer (implements IStorage interface)
  vite.ts         → Vite dev middleware setup
  static.ts       → Production static file serving
shared/           → Code shared between client and server
  schema.ts       → Shared data contracts + Zod types
  routes.ts       → API route contracts (paths, methods, Zod schemas)
```

### Key Design Decisions

- **Shared schema and routes**: The `shared/` directory contains both the database schema and API route contracts, ensuring type safety across the full stack
- **Storage interface pattern**: `IStorage` interface in `storage.ts` abstracts database operations, making it possible to swap implementations
- **Seeding source**: Default tasks, routine, kid, and assignments are seeded into `data/store.json` on first run
- **Date strings**: Completions use `YYYY-MM-DD` string format for dates rather than timestamp columns, simplifying day-level queries
- **Print support**: CSS `@media print` rules are critical — the app is designed to be printed and posted on a fridge

## External Dependencies

- **No database required**: all runtime data is persisted in JSON on disk.
- **Google Fonts**: Inter, Outfit, DM Sans, Fira Code, Geist Mono, Architects Daughter loaded via CDN
- **No authentication**: The app currently has no auth system — it's a simple family tool
- **Replit plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` used in development

## Local Run

1. Copy environment file:
   - `cp .env.example .env`
2. Run app:
   - `npm run dev`

Or run in Docker (code is bind-mounted, no image build step):

- `docker compose up -d app`
- Open `http://localhost:5001`
