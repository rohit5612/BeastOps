# BeastOps

BeastOps is a creator-operations platform designed for high-output YouTube teams.  
The goal is to bring idea generation, pipeline execution, team tasks, comments, audit timeline, and channel analytics into one workspace-first system.

---

## Product Vision

BeastOps will eventually function as an operating system for content teams:

- Plan content with structured ideas and expected performance hypotheses.
- Move each video through a clear production pipeline (idea -> script -> filming -> editing -> review -> upload -> postmortem).
- Run day-to-day execution with team tasks, assignees, deadlines, and priorities.
- Keep all context in one place with comments and an action timeline.
- Pull real YouTube + YouTube Analytics data to guide decisions.
- Give leaders a command center for what needs attention now.

---

## Core Functional Areas

### 1) Identity, Access, and Security
- Google OAuth login (YouTube-capable scopes)
- JWT session cookie auth
- Workspace scoping on every business route (`X-Workspace-Id`)
- RBAC (`ADMIN`, `CREATOR`, `EDITOR`, `VIEWER`)
- Protected system accounts:
  - `SUPERUSER`
  - `BACKUP_SUPERUSER`

### 2) Workflow Operations
- Workspace management
- Pipeline stages and stage movement
- Idea lifecycle (create, update, convert to video project)
- Task management (CRUD)
- Commenting on tasks/video projects (CRUD)
- Audit events for critical actions

### 3) Analytics and Reporting
- Channel-level overview metrics
- Per-video performance listing
- Video-level timeseries metrics
- Timeline feed for operational traceability

### 4) Frontend Experience
- Auth-aware app shell
- Workspace selector
- Feature pages wired to backend APIs
- Theme driven by tweakcn/shadcn design tokens

---

## Current Tech Stack

### Backend (`apps/api`)
- Node.js + Express (JavaScript, ESM)
- `express-promise-router`
- Prisma ORM + PostgreSQL
- JWT auth (`jsonwebtoken`) + HttpOnly cookies
- Google OAuth (manual flow endpoints)
- Token encryption for OAuth secrets (AES-256-GCM utility)

### Frontend (`apps/web`)
- React + Vite
- Tailwind CSS v4
- tweakcn/shadcn-style tokenized theme in `src/index.css`
- React Router
- TanStack Query (provider scaffold in place)

### Data/Infra
- PostgreSQL (Docker compose local option)
- Prisma migrations
- Env-driven configuration

---

## High-Level Architecture

- **Frontend (React)** calls **Backend API (Express)** with credentials and workspace header.
- **Backend services** handle business rules, RBAC, and audit logging.
- **Prisma** persists operational + analytics data in **PostgreSQL**.
- **Google OAuth + YouTube APIs** supply identity and channel/performance data.

---

## Phased Plan

This plan is aligned with `Plan/phase1.md`.

### Phase 1 - MVP Foundation (in progress)
1. Local monorepo setup (`apps/api`, `apps/web`)
2. Core backend scaffold and route modules
3. Prisma schema + migrations for ops + YouTube entities
4. Auth/session/RBAC/workspace scoping
5. Core ops APIs (pipeline, ideas, tasks, comments, audit)
6. Initial analytics endpoints
7. Frontend shell + auth gate + workspace selector + API-wired pages
8. Demo polishing, seed data, and smoke tests

### Phase 2 - Deeper Analytics + Automation
1. Full YouTube ingestion jobs (initial + scheduled)
2. Rich KPI dashboard and trend analysis
3. Smart attention queues (stale stage, overdue bottlenecks)
4. Better filtering/search and richer workflow UX

### Phase 3 - Production Hardening
1. Operational reliability and observability
2. Permissions hardening and security reviews
3. CI/CD + environment separation + release process
4. Performance optimization and scaling patterns

---

## Repository Structure

```text
/
  apps/
    api/   # Express + Prisma backend
    web/   # React + Vite frontend
  Plan/
    phase1.md
  docker-compose.yml
  .env.example
  .gitignore
```

---

## Local Development

### Backend
```bash
cd apps/api
npm install
npm run db:migrate
npm run dev
```

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### API Smoke Test
```bash
cd apps/api
npm run test:api
```

---

## Important Environment Variables (Backend)

In `apps/api/.env`:

- `PORT`, `NODE_ENV`, `CORS_ORIGIN`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `TOKEN_ENCRYPTION_KEY`
- `SUPERUSER_EMAIL`, `BACKUP_SUPERUSER_EMAIL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- Optional: `FRONTEND_URL`, `REDIS_URL`, email vars

---

## Long-Term Outcome

When complete, BeastOps should give creator teams a single place to:

- decide what to produce,
- execute fast without losing context,
- and improve output using real performance data.

