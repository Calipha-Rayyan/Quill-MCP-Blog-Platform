# Blocker Status -- Member 2 (MCP Server + Tools)

**Branch:** `feature/mcp-server`
**Owner:** Huzaifa Haider Khan
**Last updated:** 2026-09-05

## Summary

The MCP server and all four core tools are built, wired together, and
tested end-to-end using real MCP protocol calls (initialize handshake +
tools/call). This work is fully functional and demoable right now.

However, it currently runs against a **temporary mock service layer**
instead of the real shared backend, because the Team Leader's branch
(`feature/core-db`) does not yet contain `postService`, `apiKeyService`,
or any database/repository code.

## What's done

- MCP server scaffolded with Streamable HTTP transport (`src/mcp/server.ts`)
- `/health` endpoint for basic liveness checks
- MCP tools implemented and tested:
  - `create_post` -- creates a post (draft by default)
  - `publish_post` -- publishes an existing post, sets `published_at`
  - `list_posts` -- lists all posts for the current user
  - `get_post` -- fetches a single post by id
- All tools verified via curl against the live MCP endpoint (initialize
  handshake + tools/call for each tool)
- Local reference copy of the shared `Post` type (`src/types/post.ts`),
  matching section 5 of the team contract document exactly

## What's mocked (and why)

- `src/services/mockPostService.ts` -- an in-memory stand-in for the real
  `postService` described in section 7 of the team contract. Matches the
  same function signatures (`createPost`, `getPost`, `listPosts`,
  `publishPost`) so swapping it out later should be close to a drop-in
  replacement.
- Every tool currently accepts a temporary `asUserId` parameter as a
  stand-in for real authenticated user context.

## Why this violates (temporarily) the contract, and how it will be fixed

Section 6 of the team contract ("User Isolation Rule") is explicit that
MCP tools must **not** accept a raw `user_id` parameter, and must instead
derive the user from `apiKeyService.authenticateKey()` via the API key.

The `asUserId` parameter on every tool right now is a deliberate,
temporary violation of that rule -- added only so the tools are testable
end-to-end while `feature/core-db` is empty. It is clearly commented as
TEMPORARY in every tool file.

**This will be removed** as soon as `apiKeyService` exists:
1. Build `src/mcp/auth.ts` to extract and validate the API key from the
   incoming MCP request, calling `apiKeyService.authenticateKey()`.
2. Remove the `asUserId` parameter from every tool.
3. Replace `mockPostService` calls with real `postService` calls.
4. Delete `src/services/mockPostService.ts` entirely.
5. Re-run the same curl test sequence to confirm nothing broke.

## Verified state of `feature/core-db` as of this writing

```
git ls-tree -r origin/feature/core-db --name-only
```

Returns only `.gitignore`, `LICENSE`, `README.md` -- no `services/`,
`db/`, or `repositories/` code has been pushed yet.

## Bottom line

This is an external dependency blocker, not a gap in Member 2's work.
The MCP server and all four tools are complete, tested, and ready to be
wired to the real backend the moment it's available.
