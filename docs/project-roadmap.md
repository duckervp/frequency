# Frequency — Project Roadmap

## Current Focus: BE + Web

New features are built on `frequency-be` + `frequency` (web) first, then synced to `frequency-mobile`.

### Known Issues / Tech Debt
- [x] Test infrastructure: BE Vitest API tests + web Playwright e2e, both on a local SQLite test DB
- [x] Mobile unit tests (Vitest, pure logic, `npm test`)
- [x] `POST /logs` did not check that `actionId` belongs to the current user, and the log/action join was not scoped, so another user's action name could show up. Now rejected with 400 and the join only matches the owner's actions; BE `test/validation.test.ts`
- [x] `computeStreak` (web `CalendarPage.tsx`, mobile `calendar.tsx`) keyed days by UTC date — off by one day outside UTC. Now keyed by local date; regression spec `e2e/calendar-streak.spec.ts`
- [x] BE `GET /logs?date=` and `GET /logs/stats` matched days with `loggedAt LIKE 'YYYY-MM-DD%'` on UTC strings, so the calendar day list, Log page date pills and "today" count used UTC days. Both routes now take `from`/`to` ISO instants (the client's local day bounds); web sends them via `localDayRange()`. `?date=` and `/stats` without params keep the old UTC behaviour for older clients. Regression tests: BE `test/logs.test.ts` ("local-day filters"), web `e2e/day-filters.spec.ts`. Deploy BE before web (an old BE ignores `from`/`to` and returns every log)
- [ ] Mobile still uses UTC days for the day list and Log pills (`log.tsx` `toISOString().slice(0,10)` + `?date=`, `calendar.tsx` `?date=`) — fix when syncing: send `from`/`to` like web `localDayRange()`, and pass today's range to `logsApi.stats()`
- [x] Web `LogPage` date pills were built once at module load and went stale past local midnight. Now built from `useToday()` (updates at midnight and when the tab becomes visible) and selected by position, so "Today" stays today; `e2e/ui-fixes.spec.ts`
- [x] BE `POST`/`PUT /logs` accepted any `loggedAt` string. Now it must be an ISO instant with Z or an offset and is stored in UTC with Z. All bodies go through `src/lib/validate.ts` (names, notes, reminder time, icon/color, email, password; malformed JSON is a 400); BE `test/validation.test.ts`
- [x] Mobile `register.tsx` / `edit.tsx` built `loggedAt` as `<UTC date>T<local time>:00` with no offset: in UTC+7, logs between 00:00–07:00 landed on the previous day, and **Edit replaced the log's date with today's** on every save. Both now use `src/lib/time.ts` (ISO instants with Z; Register never logs in the future; Edit keeps the log's local date, refuses future times, and repairs legacy offset-less values on save). Unit tests `src/lib/time.test.ts` + `time-usage.test.ts` (mobile has no UI e2e: `expo-secure-store` does not work on web). Needs a new EAS build + Sideloadly install to reach the phone
- [ ] Mobile UI e2e: blocked because `expo-secure-store` has no web implementation (login fails in the web preview) — a web fallback for token storage would allow Playwright on `mobile-web`
- [x] Mixed `loggedAt` formats sorted and filtered wrongly (BE compares strings; old mobile builds wrote local wall time without an offset). Checked production on 2026-11-03: 0 offset-less rows, so no backfill is needed. Since 9ad6124 the BE only accepts ISO instants with Z or an offset and stores them in UTC with Z, so no new mixed rows can appear. Mobile builds from before c6a0db7 now get a 400 on Register/Edit - accepted, mobile is not in production
- [ ] Mobile Log header uses `/stats` `dateInfo`, formatted by the server in UTC — shows yesterday's date between 00:00–07:00 in UTC+7 (web already formats locally)
- [x] Web Register logged a picked time later than now in the future (e.g. 11:30 PM picked at 00:15 → tonight). Now uses the previous day (`src/lib/time.ts` `pickedTimeToISO`); regression spec `e2e/log-time.spec.ts`
- [x] Web Edit page labelled every log "Today, <date>". Now "Today / Yesterday / Oct 1 / Dec 31, 2025" (`formatLogDay`), and refuses a time in the future; `e2e/log-time.spec.ts`
- [x] BE log lists came back in insertion order. `GET /logs` (all modes) now returns newest `loggedAt` first; regression tests in BE `test/logs.test.ts` ("list order"). Visible change on web and existing mobile builds as soon as the BE deploys
- [x] Calendar streak ignored the "Tracked Action" filter and always counted all actions, while the grid and month total were filtered. Web `CalendarPage.tsx` and mobile `calendar.tsx` now filter the streak too; regression spec `e2e/calendar-streak.spec.ts` ("streak follows the selected action filter"). Mobile needs a new build to reach the phone
- [x] An expired or invalid token (JWT lasts 7 days) left web users on a dashboard of default stub actions with no redirect. A 401 for the current token on a non-`/auth` request now logs out (`setUnauthorizedHandler` in `src/lib/api.ts`, web and mobile; mobile needs a new EAS build). The web Google `#token=` is now stored before the page fetches, so a first Google login no longer loads the dashboard without a token. Regression spec `e2e/session-and-saves.spec.ts`
- [x] Web New Action "Done" header button had no saving guard, so a double tap created duplicate actions; `e2e/session-and-saves.spec.ts`
- [x] Deleting a log on the Log page (web and mobile) did not lower "Total actions today"; `e2e/session-and-saves.spec.ts`
- [x] Calendar downloaded the whole log history on every visit (3000 logs = 1.2 MB) to compute the month view and streak, and log queries scanned every user's rows (no index). Now: indexes on `action_logs(user_id, logged_at)`, `action_logs(action_id)` and `actions(user_id)`, the Calendar loads one month at a time, and the streak comes from `GET /logs/streak` (about 18 KB in total). Runbook `docs/runbooks/2026-11-03-log-indexes-and-streak.md`; tests BE `test/indexes.test.ts`, `test/streak.test.ts`, web `e2e/calendar-month-range.spec.ts`
- [x] Legacy offset-less `loggedAt` rows could make `/logs/streak` disagree with the calendar grid - none exist in production (see above)
- [ ] Mobile Calendar still loads the whole history and computes the streak itself - switch to month ranges and `/logs/streak` when syncing
- [x] Settings and New Action top bars scrolled away with the page: their wrapper had `overflow-x-hidden`, which makes it a scroll container, so `sticky top-0` stuck to a box that never scrolls. Every page built its own wrapper and header; now all signed-in pages use `PageLayout` + `TopBar`, so they cannot drift. `e2e/layout.spec.ts` ("phone layout") scrolls every page and checks the top bar. Same spec: `/register` no longer scrolls sideways by 96px (its decorative circles are clipped in their own layer)
- [ ] Mobile has the same hand-built header per screen (`src/components/header.tsx` used by some screens only) - give it one shared screen layout when syncing
- [x] Pages called the API without `.catch`: a failed request showed empty or default data with no message and left unhandled rejections. Loads now use `useLoad` and mutations `useAsyncAction`, with `ErrorState` (message + Try again); `/edit` without or with an unknown `logId` says the log was not found; `e2e/api-errors.spec.ts`
- [ ] Mobile screens still load without error handling (same pattern the web had) - port `useLoad` / `ErrorState` when syncing
- [x] Signed-in users opening `/` or `/login` saw the login form; they now go to the dashboard
- [x] Manage Actions edit/delete buttons only appeared on hover, so never on phones; now hidden only on devices that can hover
- [x] Dashboard starter actions (shown before the user has any) logged a "Quick Log"; they now open New Action prefilled with their name and icon
- [x] Deleting an action now warns that its logs stay in history as "Quick Log"
- [x] Assets: the Material Symbols font is requested with only the icons in `src/lib/icons.ts` (about 16 KB instead of 1 MB; the list includes the icons the mobile app stores, and `actionIcon()` maps `water-drop` style names), and the two hero images are local WebP files (37 KB instead of 698 KB hotlinked PNG). `e2e/ui-fixes.spec.ts` fails if any icon renders as text
- [ ] Mobile twins of these web fixes, for the next sync: Log date pills built at module load (stale past midnight), starter actions on the dashboard go to Quick Log, Calendar and its grid keep the day they were opened on (`calendar.tsx`, `calendar-grid.tsx`)
- [x] The web Calendar kept the day and month it was opened on past local midnight (selected day, today highlight, streak). It now follows `useToday()` until the user picks a day or month; a pick survives the end of the month. `e2e/calendar-midnight.spec.ts`
- [ ] Product question: the calendar streak is 0 until something is logged today, even after a run of previous days
- [x] Web lint had 2 `react-refresh/only-export-components` errors: `AuthProvider` now lives in `src/components/AuthProvider.tsx`, the context and hooks in `src/hooks/useAuth.ts`; lint is clean
- [x] BE had no migration history (DB created with `db:push`). Migrations now live in `frequency-be/src/db/migrations/` (`0000_baseline`), `test/migrations.test.ts` fails if they drift from the schema, and production is baselined with `npm run db:baseline` (runbook `docs/runbooks/2026-11-04-migration-baseline.md`)
- [x] CI: GitHub Actions runs BE tsc + Vitest (`frequency-be`) and web lint + build + e2e with the BE checked out next to it (`frequency`) on every push and PR
- [ ] Google OAuth redirects to a single `FRONTEND_URL`, so it can only serve web *or* mobile at a time
- [ ] Local BE uses the production Turso database — no separate dev DB
- [ ] Mobile `api.ts` falls back to port 3000; local BE runs on 3001 (always set `EXPO_PUBLIC_API_URL`)
- [x] API types were duplicated by hand in web and mobile. The contract now lives in `frequency-be/src/api-types.ts` (checked against the schema at compile time); web uses a generated copy (`npm run sync:api-types`, checked in CI)
- [ ] Mobile: replace the hand-written types in `src/lib/api.ts` with the same generated copy of the BE contract when syncing

---

## Mobile Sync Status

The React Native migration plan (`frequency-mobile/plans/react-native-migration-plan.md`) is mostly implemented.

- [x] Phase 1 — Scaffold (Expo, dependencies, `eas.json`)
- [x] Phase 2 — Design system (NativeWind tokens, Lexend font)
- [x] Phase 3 — Shared logic (`src/lib/api.ts`, `src/hooks/use-auth.tsx`)
- [x] Phase 4 — Navigation (`_layout`, redirect guard, `(auth)`, `(tabs)`)
- [x] Phase 5 — Shared components (header, action-item, summary-card, calendar-*, time-picker)
- [x] Phase 6 — Screens (dashboard, log, calendar, settings, create, register, edit, manage-actions)
- [ ] Phase 7 — Build & install: test on iPhone 13 via Expo Go, EAS IPA build, Sideloadly install
- [ ] Verify Google OAuth end-to-end on device (see `FRONTEND_URL` issue above)

When a web feature is finished, add a sync item here and port it to mobile.

---

## Completed ✅

- Web app: login, dashboard, log, calendar, settings, manage actions, create, register, edit
- Backend API: auth (email/password + Google OAuth, `/me`), actions CRUD, logs CRUD + stats
- Vercel deployment for backend and web
- Mobile app: all screens ported from web
- Claude Code workflow set up: `CLAUDE.md` per repo, `.claude/launch.json` dev servers, old agent skills removed
- Fixed `drizzle.config.ts` paths (`api/db` → `src/db`)

---

## Backlog

### Reminders / Notifications
- Web: browser notifications at user-set `reminderTime`
- Mobile: `expo-notifications`
- Backend could trigger via cron or scheduled push

### Developer Experience
- Share API types between web and mobile instead of copying
- Run BE tests + web e2e in CI (GitHub Actions) on every push

### Offline Support
- Cache last-fetched logs/actions; optimistic UI updates

### Enhanced Calendar
- Heatmap view (like GitHub contributions)
- Export data to CSV

### Mobile Extras
- iOS home screen widget (today's log count or streak)
- TestFlight / App Store (requires Apple Developer account, `eas submit --platform ios`)
- Android profile in `eas.json`

### Multi-Account
- Currently single-user per device; future: account switcher
