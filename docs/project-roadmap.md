# Frequency — Project Roadmap

## Current Sprint: React Native Migration

Migrating the web app to a native iOS app using Expo + NativeWind + EAS Build.

### Phase 1 — Scaffold ⬜
- [ ] Init Expo project: `npx create-expo-app@latest frequency-mobile --template blank-typescript`
- [ ] Install dependencies: nativewind, expo-router, expo-secure-store, expo-auth-session, expo-font, @expo-google-fonts/lexend, react-native-reanimated, expo-haptics, @expo/vector-icons
- [ ] Configure EAS: `eas build:configure`
- [ ] Create `.env.local` with API URL

### Phase 2 — Design System ⬜
- [ ] Create `global.css` with NativeWind theme tokens (primary, bg-dark, bg-light)
- [ ] Configure `tailwind.config.ts` for NativeWind v4
- [ ] Load Lexend font via `@expo-google-fonts/lexend`
- [ ] Define skeleton + fade-in animation utilities

### Phase 3 — Shared Logic ⬜
- [ ] Port `lib/api.ts` (swap `VITE_API_URL` → `EXPO_PUBLIC_API_URL`)
- [ ] Port `hooks/use-auth.tsx` (localStorage → expo-secure-store, useNavigate → useRouter)
- [ ] Implement Google OAuth via `expo-auth-session` + deep link callback
- [ ] Copy `data/mock-data.ts` as-is

### Phase 4 — Navigation ⬜
- [ ] `app/_layout.tsx` — root layout with AuthProvider + font loading
- [ ] `app/index.tsx` — redirect guard (login vs dashboard)
- [ ] `app/(auth)/login.tsx` — login + register screen
- [ ] `app/(tabs)/_layout.tsx` — bottom tab bar (4 tabs, MaterialIcons)

### Phase 5 — Shared Components ⬜
- [ ] `components/header.tsx`
- [ ] `components/action-item.tsx`
- [ ] `components/summary-card.tsx`
- [ ] `components/calendar-grid.tsx`
- [ ] `components/calendar-select.tsx`
- [ ] `components/calendar-stats.tsx`
- [ ] `components/time-picker.tsx`

### Phase 6 — Screens ⬜
- [ ] `app/(tabs)/dashboard.tsx` — Quick actions + last 24h feed
- [ ] `app/(tabs)/log.tsx` — Date pills + action log list
- [ ] `app/(tabs)/calendar.tsx` — Month grid + stats + day detail
- [ ] `app/(tabs)/settings.tsx` — Profile + settings rows
- [ ] `app/create.tsx` — Create action form
- [ ] `app/register.tsx` — Log an action occurrence
- [ ] `app/edit.tsx` — Edit log entry
- [ ] `app/manage-actions.tsx` — CRUD action list

### Phase 7 — Build & Install ⬜
- [ ] Test all screens in Expo Go on iPhone 13
- [ ] Build IPA via `eas build --platform ios --profile preview`
- [ ] Install on iPhone 13 via Sideloadly
- [ ] Verify all flows work as standalone app

---

## Completed ✅

- Web app (React + Vite): login, dashboard, log, calendar, settings, manage actions, create, register, edit
- Backend API: auth (email/password + Google OAuth), actions CRUD, logs CRUD + stats
- Vercel deployment for backend
- Migration plan documented (`frequency-mobile/plans/react-native-migration-plan.md`)
- Project documentation initialized (`frequency/docs/`)

---

## Backlog (Post-Migration)

### Reminders / Push Notifications
- `expo-notifications` for reminder alerts at user-set `reminderTime`
- Backend could trigger via cron or backend-scheduled push

### Android Support
- Add `android` profile to `eas.json`
- Test with Android emulator or physical device

### App Store / TestFlight
- Requires Apple Developer account ($99/yr)
- Upload build via EAS Submit: `eas submit --platform ios`

### Offline Support
- Cache last-fetched logs/actions in `AsyncStorage`
- Optimistic UI updates

### Widgets
- iOS home screen widget showing today's log count or active streak

### Enhanced Calendar
- Heatmap view (like GitHub contributions)
- Export data to CSV

### Multi-Account
- Currently single-user per device; future: account switcher
