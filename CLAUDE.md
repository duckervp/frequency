# frequency (web)

Vite + React 19 web client for Frequency — the **primary** client. New features are built here (together with `../frequency-be`) first; `../frequency-mobile` is synced from this app afterwards. See `../CLAUDE.md` for the system overview.
## Commands

- Dev: `npm run dev` → http://localhost:5173. `.env.local` sets `VITE_API_URL=http://localhost:3001/api` (local BE; no Vite proxy). The deployed BE URL is kept there commented out. Restart the dev server after changing `.env.local`.
- Local login: use **email + password**. Google OAuth redirects back to the deployed BE, so it does not work against the local BE.
- Verify: `npm run build`, `npm run lint` and `npm run test:e2e` (CI runs all three on every push to `master` and on PRs: `.github/workflows/ci.yml`)
  - Lint must be clean (0 problems); CI runs it.

## E2E tests (Playwright)

- `npm run test:e2e` (or `test:e2e:ui`) — specs in `e2e/`, Chromium only.
- `playwright.config.ts` starts its own servers on test ports: BE **:3101** via `npm --prefix ../frequency-be run test:server` (fresh local SQLite DB, never Turso) and Vite **:5174** with `VITE_API_URL=http://localhost:3101/api`. Dev servers on 3001/5173 can keep running.
- Needs `../frequency-be` checked out next to this repo.
- Use `registerViaUi()` from `e2e/helpers.ts` for a fresh user per test (unique email) — tests must not depend on each other's data.
- Google OAuth is not covered by e2e (needs the deployed BE).
- Every bug fix that is visible in the UI gets an e2e spec that fails before the fix.

## Layout

- `src/pages/` — one component per route (`DashboardPage`, `LogPage`, `CalendarPage`, ...); the route ↔ API table is in `docs/codebase-summary.md`
- `src/components/` — PascalCase shared components
- `src/lib/api.ts` — fetch wrapper; request/response types come from `src/lib/api-types.ts`, a generated copy of `../frequency-be/src/api-types.ts` (`npm run sync:api-types`, never edit it; CI fails if it is stale); `src/hooks/useAuth.ts` — auth context and hooks (`AuthProvider` is in `src/components/`)
- `docs/` — system-wide docs (overview, architecture, code standards, design guidelines, roadmap, deployment)

## Conventions

Follow `docs/code-standards.md` and `docs/design-guidelines.md`. Deployed on Vercel as an SPA (`vercel.json` rewrites everything to `index.html`).
