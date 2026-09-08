# Quill — MCP-Native Blogging Platform

<p align="center">
  <strong>Manage your blog through AI agents using the Model Context Protocol (MCP).</strong>
</p>

<p align="center">
  <em>One backend · One database · Multiple interfaces</em>
</p>

---

## Overview

**Quill** is an MCP-native blogging platform that lets AI agents — such as Claude, Cursor, and Windsurf — create, edit, schedule, publish, and analyze blog posts through MCP tools.

Quill combines:

- 🤖 AI-powered blog management through MCP
- 🖥️ A modern React dashboard
- 🌐 A public-facing blog
- 🔐 API-key authentication
- 📊 Analytics
- 🗄️ SQLite persistence
- 🐳 Docker deployment support

All interfaces connect to the same backend services and the same database, giving the project a single source of truth for blog content.

---

## Why Quill?

Traditional blogging platforms require switching between dashboards, editors, settings pages, and analytics screens. Quill takes an AI-first approach instead — you tell an AI agent what you want, and it does it:

> "Create a draft about AI agents."
> "Update the title of my latest post."
> "Schedule this article for tomorrow at 9 AM."
> "Publish the post."
> "Show me my blog analytics."

The AI agent talks to Quill through authenticated MCP tools, while Quill handles validation, authorization, business logic, and persistence.

---

## Architecture

```
                         ┌─────────────────────┐
                         │      AI Agents       │
                         │ Claude / Cursor /     │
                         │ Windsurf / etc.       │
                         └──────────┬───────────┘
                                    │
                              API Key (Bearer)
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Quill MCP       │
                         │       Server         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Shared Services     │
                         │ Auth · Posts ·        │
                         │ SEO · Analytics       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       SQLite          │
                         │      Database         │
                         └───────┬───────┬───────┘
                                 │       │
                    ┌────────────┘       └────────────┐
                    ▼                                  ▼
          ┌──────────────────┐              ┌──────────────────┐
          │  React Dashboard  │              │   Public Blog     │
          │   localhost:5173  │              │  Published posts  │
          └──────────────────┘              └──────────────────┘
```

### Core principle

The AI agent never touches SQLite directly:

```
AI Agent → MCP Tool → Authentication → Shared Service → Repository → SQLite
```

This keeps authorization, validation, and business rules centralized in one place, used by every surface (MCP, dashboard, public blog) equally.

---

## Features

### MCP tools

Quill exposes 10 MCP tools:

| Tool | Purpose |
|---|---|
| `create_post` | Create a new post |
| `update_post` | Update an existing post |
| `delete_post` | Delete a post |
| `list_posts` | List the authenticated user's posts |
| `get_post` | Retrieve a specific post |
| `publish_post` | Publish a post |
| `schedule_post` | Schedule future publication |
| `unpublish_post` | Move a published post back to draft |
| `manage_seo` | Manage a post's SEO metadata |
| `get_analytics` | Retrieve analytics for the user's posts |

MCP tools never accept a `user_id` parameter — the authenticated identity (from the API key) determines which user's data can be accessed.

### Web dashboard

- Signup and login
- Dashboard overview
- Post creation, editing, and management
- Publishing, unpublishing, and scheduled publishing
- SEO metadata management
- Analytics
- API-key management
- Account management

### Public blog

```
GET /blog
GET /blog/:slug
```

Only posts with `status = published` are ever returned. Draft and future-scheduled posts remain private.

### Authentication

Quill authenticates MCP requests with an API key:

```
Authorization: Bearer <api-key>
```

Raw keys are shown once at creation time; only their hash is stored.

---

## Example workflow

```
1. "Create a draft titled 'The Future of AI-Native Applications'."
   → create_post

2. "Add a section explaining how MCP connects AI agents to applications."
   → update_post

3. "Set the SEO title and description for this post."
   → manage_seo

4. "Publish the post."
   → publish_post

5. The published post is now visible on the public blog.
```

```
AI Agent → MCP → SQLite → Dashboard / Public Blog
```

---

## Project structure

```
quill-mcp-blog-platform/
│
├── src/
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── apiKeyAuth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── sessionAuth.ts
│   │   └── routes/
│   │       ├── accountRoutes.ts
│   │       ├── analyticsRoutes.ts
│   │       ├── authRoutes.ts
│   │       └── postRoutes.ts
│   │
│   ├── db/
│   │   ├── database.ts
│   │   ├── migrations/
│   │   │   ├── 001_initial.sql
│   │   │   └── index.ts
│   │   └── repositories/
│   │       ├── analyticsRepository.ts
│   │       ├── apiKeyRepository.ts
│   │       ├── postRepository.ts
│   │       └── userRepository.ts
│   │
│   ├── mcp/
│   │   └── server.ts
│   │
│   ├── services/
│   │   ├── analyticsService.ts
│   │   ├── apiKeyService.ts
│   │   ├── authService.ts
│   │   └── postService.ts
│   │
│   ├── types/
│   │   ├── analytics.ts
│   │   ├── post.ts
│   │   └── user.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── slug.ts
│   │   └── validation.ts
│   │
│   ├── web/
│   │   └── routes/
│   │       └── publicBlogRoutes.ts
│   │
│   └── server.ts
│
├── frontend/
│   ├── src/
│   ├── vite.config.ts
│   ├── package.json
│   └── ...
│
├── tests/
│   ├── integration/
│   │   └── core.test.ts
│   └── mcp/
│       └── server.test.ts
│
├── data/
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## Technology stack

**Backend:** Node.js · TypeScript · Express · SQLite · custom MCP JSON-RPC / Streamable-HTTP-compatible adapter

**Frontend:** React · TypeScript · Vite · React Router · Lucide React

**Infrastructure:** Docker · SQLite persistent storage

---

## Running locally

### 1. Clone the repository

```bash
git clone https://github.com/Calipha-Rayyan/Quill-MCP-Blog-Platform.git
cd Quill-MCP-Blog-Platform
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Set a secure session secret:

```
SESSION_SECRET=your-long-random-secret
```

The server refuses to start with the placeholder default, so this must be changed. You can also set:

```
PORT=3000
DATABASE_PATH=./data/quill.db
MCP_BASE_PATH=/mcp
```

### 4. Start the backend

```bash
npm run dev
```

Runs at:

```
http://localhost:3000
```

### 5. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Runs at:

```
http://localhost:5173
```

> Backend and frontend run as two independent processes on two different ports. There is currently no CORS middleware or dev proxy configured between them — this needs to be added before the dashboard can call the live API from the browser.

---

## API endpoints

**Authentication**
```
POST /api/auth/signup
POST /api/auth/login
```

**Posts** — `/api/posts` (session-authenticated)
List · Create · Get · Update · Delete · Publish · Unpublish · Schedule

**API keys** — `/api/account/api-keys` (session-authenticated)
Create · List · Rotate · Revoke

**Analytics**
```
GET /api/analytics
```

**Health**
```
GET /health
```
```json
{ "status": "ok" }
```

**Public blog**
```
GET /blog
GET /blog/:slug
```

**MCP**
```
POST /mcp
Authorization: Bearer <api-key>
```

---

## Testing

```bash
npm run build
npm test

cd frontend
npm run build
```

**Last verified:**
- Backend build: PASS
- Backend tests: 6/6 PASS
- Frontend build: PASS

The test suite covers post creation/publishing, ownership isolation, scheduling behavior (including auto-promotion of due scheduled posts), authentication, MCP tool exposure and enforcement, and API-key revocation.

---

## Docker

Build the image:

```bash
docker build -t quill .
```

Run with persistent SQLite storage:

```bash
docker run --rm -p 3000:3000 \
  -v quill-data:/data \
  -e SESSION_SECRET="replace-with-a-long-random-secret" \
  quill
```

The container uses `DATABASE_PATH=/data/quill.db`; the `/data` volume preserves the database across container restarts. Verify with:

```bash
curl http://localhost:3000/health
```

---

## Security

- MCP tools never accept `user_id` — identity comes from the authenticated API key.
- Repository and service operations enforce per-user ownership.
- API keys are stored as hashes only, and are revocable.
- Public routes expose published content only.
- `.env` files must never be committed; secrets and API keys must never be published.

---

## Current MCP implementation

Quill currently uses a custom Streamable-HTTP-compatible JSON-RPC adapter at `src/mcp/server.ts`, not the official `@modelcontextprotocol/sdk`. This was a deliberate, documented workaround adopted during development and is the single MCP transport used by the project. Migrating to the official SDK's `StreamableHTTPServerTransport` remains a tracked follow-up.

---

## Project status

**Status: Working MVP**

| Area | Status |
|---|---|
| MCP server (10 tools) | ✅ |
| API-key authentication | ✅ |
| React dashboard (UI shell) | ✅ |
| React dashboard (live API integration) | ⚠️ In progress |
| Public blog | ✅ |
| Scheduling | ✅ |
| SEO management | ✅ |
| Analytics | ✅ |
| SQLite database | ✅ |
| Automated tests | ✅ |
| Docker support | ✅ |
| OAuth / Claude.ai remote connector | ⚠️ Not yet implemented/verified in this codebase |

> **Note:** OAuth endpoints, Claude.ai remote-connector flow, and Cloudflare Tunnel integration are documented here as a planned/target capability, not a currently verified part of this codebase. Only API-key authentication (`Authorization: Bearer <api-key>`) has been implemented and tested so far. Update this section once OAuth is actually built and tested.

---

## Team

Developed as a Zeppelin Labs Fellowship Capstone project.

## License

See the [LICENSE](./LICENSE) file for details.