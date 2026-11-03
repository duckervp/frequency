# frequency (web)

Vite + React 19 web client for Frequency — the **primary** client. New features are built here (together with `../frequency-be`) first; `../frequency-mobile` is synced from this app afterwards. See `../CLAUDE.md` for the system overview.
## Commands

- Dev: `npm run dev` → http://localhost:5173. `.env.local` sets `VITE_API_URL=http://localhost:3001/api` (local BE; no Vite proxy). The deployed BE URL is kept there commented out. Restart the dev server after changing `.env.local`.
- Local login: use **email + password**. Google OAuth redirects back to the deployed BE, so it does not work against the local BE.
- Verify: `npm run build` and `npm run lint`
  - Known baseline: lint reports 2 `react-refresh/only-export-components` errors in `src/hooks/useAuth.tsx`. Don't add new ones.

## Layout

- `src/pages/` — one component per route (`DashboardPage`, `LogPage`, `CalendarPage`, ...); the route ↔ API table is in `docs/codebase-summary.md`
- `src/components/` — PascalCase shared components
- `src/lib/api.ts` — fetch wrapper + API types; `src/hooks/useAuth.tsx` — auth context
- `docs/` — system-wide docs (overview, architecture, code standards, design guidelines, roadmap, deployment)

## Conventions

Follow `docs/code-standards.md` and `docs/design-guidelines.md`. Deployed on Vercel as an SPA (`vercel.json` rewrites everything to `index.html`).
