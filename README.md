# Quill — MCP-Native Blogging Platform

Quill uses one Node.js/TypeScript backend, shared services, and one SQLite database for the React dashboard, HTTP API, and public blog. The HTTP API never accepts a `user_id`; authenticated sessions establish the user context, and repository queries enforce ownership.

## Run locally

```bash
cp .env.example .env
# Replace SESSION_SECRET with a high-entropy secret.
npm install
npm run dev
```

The server initializes SQLite and applies tracked migrations at startup. Use `DATABASE_PATH` to select a persistent location.

## HTTP API

- `POST /api/auth/signup` and `POST /api/auth/login` return a signed bearer token.
- Authenticated dashboard endpoints (`Authorization: Bearer <token>`):
  - `/api/posts` supports listing, creation, retrieval, editing, deletion, publishing, scheduling, and unpublishing.
  - `/api/account/api-keys` supports key creation, rotation, revocation, and safe key listing.
  - `GET /api/analytics` returns analytics totals for the authenticated user's posts.
- Public read-only routes are `GET /blog` and `GET /blog/:slug`. They exclusively use the public post-service methods, so draft and future-scheduled posts cannot be returned.
- `GET /health` is a deployment health check.

## Checks

```bash
npm run build
npm test
cd frontend && npm run build
```

## Docker

Build and run with a persistent SQLite volume and explicit secrets:

```bash
docker build -t quill .
docker run --rm -p 3000:3000 -v quill-data:/data \
  -e SESSION_SECRET='replace-with-a-long-random-secret' quill
```
