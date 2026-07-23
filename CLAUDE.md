# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ملعب المهام (Task Playground)** — an Arabic RTL multi-user task management app with live timers, peer star ratings, and team leaderboards. Converted from a static prototype (`_extracted/`) into a full-stack Next.js app in the `web/` directory.

## Commands

All commands run from `web/`:

```bash
cd web
npm install                          # install dependencies
npx prisma migrate dev --name init   # run migrations (first time)
npm run db:seed                      # seed demo data (resets all tables)
npm run dev                          # dev server at localhost:3000
npm run build                        # production build
npm run lint                         # ESLint (flat config, next core-web-vitals + typescript)
npm run db:reset                     # drop & recreate DB + re-seed
npm run db:migrate                   # prisma migrate dev
```

## Architecture

### Stack
- **Next.js 16** (App Router) + TypeScript + React 19
- **Prisma** + SQLite (`prisma/dev.db`; swap `DATABASE_URL` for Postgres)
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Auth**: cookie-based JWT sessions (`jose` + `bcryptjs`), no middleware — auth checks done in page server components and server actions
- **Validation**: `zod` for form input

### Directory Layout (`web/src/`)

```
src/
├── app/
│   ├── actions.ts          # ALL server actions (auth, team, task CRUD, rating, submission)
│   ├── layout.tsx          # Root layout (RTL, lang="ar")
│   ├── page.tsx            # "/" — redirects to first team or /teams
│   ├── login/page.tsx      # Login page
│   ├── register/page.tsx   # Register page
│   ├── teams/page.tsx      # Team list + create/join forms
│   └── t/[teamId]/page.tsx # Main playground (server component wrapping <Playground>)
├── components/
│   ├── Playground.tsx      # Core client component — tasks, dashboard, leaderboard, profile views
│   ├── AuthForms.tsx       # Login/Register forms (useActionState)
│   ├── AuthShell.tsx       # Shared auth page layout
│   └── TeamForms.tsx       # Create team / join team forms
└── lib/
    ├── auth.ts             # Session helpers (create/destroy/get/require)
    ├── db.ts               # Singleton PrismaClient
    ├── format.ts           # UI constants (categories, colors, formatters) — shared by client & server
    └── team.ts             # getTeamPayload() — loads full team data; pointsForMember() scoring
```

### Key Patterns

- **Single actions file**: All mutations live in `src/app/actions.ts` as server actions. No API routes.
- **Data flow**: Server components fetch data via `getTeamPayload()` → pass as `initial` prop to `<Playground>` client component. Client-side refreshes use `router.refresh()` after mutations.
- **Task lifecycle**: `running` → `review` (owner submits proof via `finishTaskAction`) → `done` (peer rates via `rateTaskAction`). Owner cannot rate own task.
- **Points**: `basePoints` (per-membership) + `stars * 2` for each completed task. Calculated by `pointsForMember()` in `lib/team.ts`.
- **File uploads**: Task proof images saved to `public/uploads/`, max 5MB, JPEG/PNG/WebP/GIF only.
- **Path alias**: `@/*` maps to `./src/*`.

### Data Models (Prisma)

`User` → `Membership` (many-to-many with `Team`) → `Task` (has one `Submission`, one `Rating`). Task statuses: `running`, `review`, `done`.

### Demo Data

Seed creates 5 users (password: `demo1234`), one team ("فريق التسويق", invite code: `MARKETING`), and sample tasks in all states.

## UI Notes

- All UI text is Arabic. Maintain RTL direction (`dir="rtl"`, `lang="ar"`).
- Styling uses inline styles matching the original prototype's warm palette (#FFF7EC background, #2B2118 text, #FFE3B3 borders).
- Categories are Arabic: تصميم (Design), مبيعات (Sales), تطوير (Dev), إداري (Admin).
- The `_extracted/` directory contains the original static prototype for reference only.
