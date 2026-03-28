## BeastOps Phase 1 — MVP Todo List

> Scope: Build a demo-ready PERN + Tailwind + shadcn/tweakcn MVP with real YouTube ingestion, focused on a single-tenant “workspace” that models a high-output creator team. All code in JavaScript (no TypeScript).

---

### 0. Local environment & base apps
1. **Create repo + root config**
   - Initialize git repo.
   - Add `.gitignore` for Node, Vite, logs, env files.
   - Add root `README.md` with short product pitch and high-level architecture.
2. **Dockerized Postgres**
   - Create `docker-compose.yml` with Postgres service (and optional pgAdmin).
   - Define DB name/user/password via `.env` and `.env.example`.
3. **Backend app scaffold (`apps/api`)**
   - Initialize `apps/api` with Express (JavaScript).
   - Add `src/server.js` with healthcheck route.
   - Wire basic error handling + logging middleware.
4. **Frontend base (`apps/web`) — you will do initial setup**
   - Initialize React + Vite app (JavaScript) in `apps/web`.
   - Install Tailwind + base config.
   - Confirm dev servers run (`api` + `web`).

---

### 1. Database schema & migrations
1. **Set up Prisma**
   - Install Prisma + Postgres driver in `apps/api`.
   - Create `prisma/schema.prisma` and `prisma/migrations/`.
2. **Core entities (first pass)**
   - `User`, `Workspace`, `WorkspaceMember` (role enum).
   - `VideoProject`, `PipelineStage`.
   - `Idea`, `Task`, `Comment`.
   - `AuditEvent`.
3. **YouTube integration entities**
   - `OAuthAccount` (Google account + encrypted tokens).
   - `Channel`, `Video`.
   - `MetricTimeseries` (daily metrics per video).
   - `MetricSnapshot` (latest metrics per video).
4. **Indexes & constraints**
   - Index `WorkspaceMember (workspaceId, userId)`.
   - Index `Video (workspaceId, youtubeVideoId)`.
   - Index `MetricTimeseries (videoId, date)`.
5. **Migrations**
   - Run `prisma migrate dev` and verify schema in Postgres.

---

### 2. API structure (routes / controllers / services)
1. **Folder layout**
   - `apps/api/src/routes/`
   - `apps/api/src/controllers/`
   - `apps/api/src/services/`
   - `apps/api/src/middlewares/`
   - `apps/api/src/auth/`
   - `apps/api/src/jobs/`
2. **Base router**
   - Create `routes/index.js` and mount:
     - `/auth`
     - `/workspaces`
     - `/pipeline`
     - `/videos`
     - `/ideas`
     - `/tasks`
     - `/comments`
     - `/analytics`
3. **Standard patterns**
   - Controllers: thin, request/response handling only.
   - Services: business logic, DB access, external API calls.
   - Middlewares: auth, workspace scoping, error handling.

---

### 3. Auth, sessions, and RBAC
1. **Session infrastructure**
   - Decide between cookie-session or JWT-in-cookie (server-side verification).
   - Implement session middleware to attach `req.user`.
2. **Google OAuth (YouTube-capable scopes)**
   - Implement `/auth/google` redirect handler.
   - Implement `/auth/google/callback` to:
     - Exchange code for tokens.
     - Create or update `User` and `OAuthAccount`.
     - Set session cookie.
3. **Workspace selection / membership**
   - Implement `/me` to return current user + memberships.
   - Implement `/workspaces` CRUD:
     - Create workspace.
     - List workspaces for user.
   - Ensure all subsequent routes require a `workspaceId` (header/query/path).
4. **RBAC middleware**
   - Implement role check helper:
     - `requireRole('Admin')`, `requireRole(['Admin', 'Creator'])`, etc.
   - Apply to write operations (creating tasks, moving pipeline cards, managing members).

---

### 4. Core ops domain (pipeline, ideas, tasks, comments)
1. **Pipeline stages**
   - Seed default stages: Idea, Script, Filming, Editing, Review, Upload, Postmortem.
   - API: list stages per workspace.
2. **Video projects**
   - API: create/update/list `VideoProject` by stage.
   - API: move video between stages (drag-and-drop support).
   - Ensure moves log an `AuditEvent`.
3. **Ideas**
   - API: CRUD `Idea` with fields (title, hooks, thumbnail concepts, tags, expected performance).
   - API: convert idea → new `VideoProject` and link.
4. **Tasks**
   - API: CRUD `Task` attached to `VideoProject` (or workspace general).
   - Fields: assignee, due date, status, priority.
5. **Comments**
   - API: CRUD `Comment` for `VideoProject` and `Task`.
   - Include simple @mention text, no full notifications yet.
6. **Audit log**
   - Service: helper to append `AuditEvent` for key actions (stage change, title change, assigned task, etc.).
   - API: list recent audit events per video.

---

### 5. YouTube integration — ingestion & metrics
1. **Token storage**
   - Encrypt refresh tokens before saving to `OAuthAccount`.
   - Never log raw tokens.
2. **YouTube client wrapper**
   - Utility service to call:
     - YouTube Data API (list videos, metadata).
     - YouTube Analytics API (views, impressions, CTR, watch time).
3. **Initial sync job**
   - Job: given a workspace and channel:
     - Fetch channel + last N days of videos (e.g., 90 days).
     - Insert/update `Channel` and `Video` records.
     - For each video, fetch daily metrics and write `MetricTimeseries` + `MetricSnapshot`.
4. **Ongoing sync (simple version)**
   - Scheduled job (e.g., every 6–12 hours):
     - Fetch new metrics for existing videos.
     - Append to `MetricTimeseries` and refresh `MetricSnapshot`.
5. **Analytics endpoints (MVP)**
   - Channel overview: totals + last 28 days.
   - Per-video performance: views, impressions, CTR, avg view duration.
   - Basic time-series for a single video.

---

### 6. Frontend — base layout & shared primitives
> You will first create `apps/web` with React + Vite + Tailwind. After that is in place, we will refine the structure and components below.

1. **Design system setup**
   - Install shadcn/tweakcn in `apps/web`.
   - Create base theme (colors, radius, typography).
   - Implement layout shell: sidebar (sections), top bar (workspace + user switcher).
2. **API client + auth handling**
   - Implement `lib/api.js`:
     - Base axios/fetch wrapper with credentials and error handling.
   - Implement `lib/auth.js`:
     - Helpers to call `/me` and interpret logged-in state.
3. **Global providers**
   - Query client (TanStack Query) provider.
   - Toast/notification provider.
   - Theme provider.

---

### 7. Frontend — key pages (MVP skeleton)
1. **Auth + workspace selection**
   - Login page with “Sign in with Google”.
   - Post-login workspace switcher/selector.
2. **Command Center**
   - High-level KPI cards (pulled from analytics endpoints).
   - “What needs attention” list:
     - Overdue tasks.
     - Videos stuck in a stage longer than X days.
3. **Pipeline board**
   - Kanban with columns per `PipelineStage`.
   - Cards representing `VideoProject` with basic metadata.
   - Drag-and-drop (dnd-kit) to move videos; optimistic updates.
4. **Video detail page**
   - Tabs:
     - Overview (metadata, stage, owners).
     - Tasks (list + inline status change).
     - Comments.
     - Timeline/audit log (from `AuditEvent`).
5. **Ideas page**
   - Table/list of ideas with search/filter.
   - Action to “Convert to video project”.
6. **Calendar**
   - Simple month view (e.g., using a basic calendar component).
   - Shows uploads + key tasks per date.
7. **Analytics page**
   - Channel summary (KPIs, small chart).
   - Per-video table with key metrics columns.

---

### 8. Polishing for demo
1. **Seed data**
   - Script to seed:
     - Demo workspace.
     - A few users.
     - Sample pipeline with videos, tasks, ideas, comments.
2. **Loading/empty/error states**
   - Graceful loaders on all main pages.
   - Empty states that explain what to do next.
3. **Basic tests / sanity checks**
   - Simple API tests (health, auth flow smoke test).
   - Frontend smoke test (pipeline page renders with seeded data).
4. **Demo script**
   - Write a short step-by-step flow you’ll narrate when presenting the MVP.

