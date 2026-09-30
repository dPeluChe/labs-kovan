# AGENTS.md

Notes for agents working on this repo. What the project is lives in
`README.md`; this file only holds what the code can't show at a glance.
UI copy and user-facing strings are Mexican Spanish (`README.md` §Convenciones).

## Read first — conventions live in these docs, follow them, don't restate

- `convex/README.md` — backend conventions: the `sessionToken` +
  `requireFamilyAccessFromSession` auth pattern required for any function
  touching family data, the split-module + `<module>.ts` barrel pattern, and
  how agent tools under `convex/lib/agent/` are wired.
- `README.md` §Convenciones + §Design system — mandatory UI primitives
  (`StickyHeader`, `EmptyState`, `ContextMenu`, `moduleColor()`, …); inline
  markup duplicating them is rejected in review.
- `docs/TASK_TODO.md` header — backlog rules: tasks get tracked there, never
  in README/CHANGELOG. Completed work moves to `docs/TASK_COMPLETED/YYMM.md`
  (format in that dir's README); features have shipped with dated es-MX
  `CHANGELOG.md` entries — follow suit.
- `docs/MCP.md` — MCP server contract; a new tool is registered once in
  `convex/lib/agent/index.ts` and serves both the in-app agent and POST /mcp.

## Gates

- `npm run lint` · `npm run test` (Vitest, single run) · `npm run build`
  (`tsc -b && vite build`) · `npm run dev`. CI = lint → test → build
  (`.github/workflows/ci.yml`); `orbital.yaml` mirrors the same gates.
- `npm run build` does NOT need a live backend — CI passes a placeholder
  `VITE_CONVEX_URL` (`ci.yml:43-47`). But `src/lib/convex.ts` throws without
  it, so `npm run dev` needs the var set (a placeholder boots; a real
  deployment URL makes it work).
- `convex/_generated/` is committed; regenerate with `npx convex dev`. The
  manual-edit workaround for offline agents is in `convex/README.md`
  §Desarrollo local.

## Traps — checks stay green while these are broken

- **`convex/` is typechecked by no gate.** `tsc -b` only covers
  `tsconfig.app.json` + `tsconfig.node.json` (`tsconfig.json` references); the
  same blind spot exists in `ci.yml` and `orbital.yaml`. After touching
  `convex/`, run `npx tsc --noEmit -p convex/tsconfig.json` yourself
  (backlog `REVIEW-HEALTH`).
- **`convex/cloudinary.ts` `deleteImage` is a silent no-op**: `CLOUDINARY_CONFIG`
  is hardcoded empty (lines 6-10) so it always returns
  `{ success: true, skipped: true }` while old images accumulate (backlog
  `REVIEW-CLOUDINARY`). Don't treat its `success` as proof of deletion.
- **Backend env vars do NOT go in `.env.local`.** `GEMINI_API_KEY`,
  `GOOGLE_CLIENT_*`, `CLOUDINARY_*` are read via `process.env` inside
  `convex/` — set them in the Convex Dashboard. Both `.env.example` and
  `README.md` §Setup document the split.
- **AI deps are `@google/generative-ai` only** (`convex/agent.ts`). `ai`,
  `@ai-sdk/*`, `langchain`, `@langchain/*`, `matter-js`, `uuid`, `zod` and
  `@types/react-router-dom` were removed as dead (PR #22) — don't re-add
  them; `matter-js` comes back only with `PhysicsEngine` (backlog
  `ACTIVITIES-CORE`). `REVIEW-DEADCODE` still tracks dead functions:
  `users.getCurrentUser`/`getOrCreateUser` and `featureRequests.list`.
- CI runs on a self-hosted pool and **skips forked PRs** (`ci.yml`), so a fork
  PR shows no check results — run the gates locally before asking for review.
