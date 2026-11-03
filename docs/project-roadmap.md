# Frequency — Project Roadmap

## Current Focus: BE + Web

New features are built on `frequency-be` + `frequency` (web) first, then synced to `frequency-mobile`.

### Known Issues / Tech Debt
- [ ] No automated tests in any repo (verification = typecheck + lint + running the app)
- [ ] Web lint: 2 `react-refresh/only-export-components` errors in `src/hooks/useAuth.tsx`
- [ ] BE has no migration history (DB created with `db:push`) — baseline migrations before using `db:migrate`
- [ ] Google OAuth redirects to a single `FRONTEND_URL`, so it can only serve web *or* mobile at a time
- [ ] Local BE uses the production Turso database — no separate dev DB
- [ ] Mobile `api.ts` falls back to port 3000; local BE runs on 3001 (always set `EXPO_PUBLIC_API_URL`)
- [ ] API types are duplicated by hand in web and mobile `src/lib/api.ts`

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
- Add tests (Vitest) for BE routes, starting with auth
- Share API types between web and mobile instead of copying

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
