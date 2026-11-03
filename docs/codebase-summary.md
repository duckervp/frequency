# Frequency — Codebase Summary

## Repository Layout

```
D:\vibe\freq\                Workspace root (not a git repo) — CLAUDE.md, .claude/launch.json
├── frequency/              Web app (React + Vite) — primary client
│   ├── docs/               System docs (this folder)
│   ├── src/
│   │   ├── pages/          9 page components
│   │   ├── components/     8 shared UI components
│   │   ├── hooks/          useAuth context
│   │   ├── lib/            api.ts (fetch wrapper + types)
│   │   └── data/           mockData.ts
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── frequency-be/           Backend API (Hono + Drizzle + Turso)
│   └── src/
│       ├── server.ts       Local Node server (port 3001)
│       ├── index.ts        Hono app: route registration + CORS (Vercel entry)
│       ├── routes/
│       │   ├── auth.ts     Register, Login, Google OAuth, /me
│       │   ├── actions.ts  CRUD actions
│       │   └── logs.ts     CRUD logs + stats
│       ├── db/
│       │   └── schema.ts   Drizzle schema (users, actions, action_logs)
│       ├── middleware/
│       │   └── auth.ts     JWT Bearer middleware
│       └── lib/
│           ├── db.ts       Turso client
│           ├── jwt.ts      signToken / verifyToken
│           └── id.ts       nanoid wrapper
│
└── frequency-mobile/       iOS app (Expo) — synced from web
    ├── plans/
    │   └── react-native-migration-plan.md
    ├── app/                expo-router screens: (auth)/, (tabs)/, create, edit, register, manage-actions
    └── src/
        ├── components/     7 kebab-case components ported from web
        ├── hooks/          use-auth.tsx (expo-secure-store)
        ├── lib/            api.ts (fetch wrapper + types)
        └── data/           mock-data.ts (DEFAULT_ACTIONS)
```

## Web Frontend (`frequency/src/`) — Primary

### Pages

| File | Route | Key APIs Used |
|---|---|---|
| `LoginPage.tsx` | `/login` | `authApi.login`, `authApi.register`, `authApi.loginWithGoogle` |
| `DashboardPage.tsx` | `/dashboard` | `actionsApi.list`, `logsApi.list({ last24h: true })` |
| `LogPage.tsx` | `/log` | `logsApi.list({ date })`, `logsApi.stats`, `logsApi.remove` |
| `CalendarPage.tsx` | `/calendar` | `logsApi.list` (one month via `localMonthRange`, one day via `localDayRange`), `logsApi.streak`, `actionsApi.list` |
| `SettingsPage.tsx` | `/settings` | `useAuth` (user, logout) |
| `ManageActionsPage.tsx` | `/manage-actions` | `actionsApi.list`, `actionsApi.remove` |
| `CreateActionPage.tsx` | `/create` | `actionsApi.create` |
| `RegisterActionPage.tsx` | `/register?actionId=` | `actionsApi.list`, `logsApi.create` |
| `EditActionPage.tsx` | `/edit?logId=` | `logsApi.get`, `logsApi.update`, `logsApi.remove` |

### Shared Components

| File | Purpose |
|---|---|
| `BottomNav.tsx` | Fixed bottom nav bar (4 tabs + optional FAB) |
| `Header.tsx` | Sticky title bar with optional back button |
| `ActionItem.tsx` | Log entry row with icon, title, time, note, edit/delete |
| `CalendarGrid.tsx` | Monthly calendar grid with active/selected day highlighting |
| `CalendarSelect.tsx` | Action filter dropdown for calendar view |
| `CalendarStats.tsx` | Total this month + current streak stat cards |
| `SummaryCard.tsx` | Hero card with cover image + total action count |
| `TimePicker.tsx` | Hour/minute picker for log timestamp |

### Hooks and Utilities

| File | Purpose |
|---|---|
| `hooks/useAuth.tsx` | Auth context: user, token, login, register, loginWithGoogle, logout |
| `lib/api.ts` | Typed fetch wrapper + `authApi`, `actionsApi`, `logsApi` |
| `data/mockData.ts` | Default action stubs (medicine, water, exercise, read, meditate) |

## Backend (`frequency-be/src/`)

### Key Files

| File | Purpose |
|---|---|
| `server.ts` | Local Node server (port 3001, `PORT` env) |
| `index.ts` | Hono app (`basePath('/api')`), route registration, CORS config, `/health`; Vercel entry |
| `routes/auth.ts` | register, login, Google OAuth, /me |
| `routes/actions.ts` | List/create/update/delete actions |
| `routes/logs.ts` | List/create/update/delete logs + stats |
| `db/schema.ts` | Drizzle schema: `users`, `actions`, `action_logs` |
| `middleware/auth.ts` | JWT Bearer token extraction → `c.set('userId', ...)` |
| `lib/db.ts` | Turso LibSQL client |
| `lib/jwt.ts` | `signToken(userId)` / `verifyToken(token)` using JOSE |
| `lib/id.ts` | `genId()` NanoID generator |

### Google OAuth Flow (Backend)

1. GET `/api/auth/google` → redirects to Google consent page
2. Google redirects → GET `/api/auth/google/callback?code=...`
3. Backend exchanges code for Google access token
4. Fetches Google profile (id, email, name, picture)
5. Upserts user in DB (link by googleId or email)
6. Issues JWT → redirects to `FRONTEND_URL/dashboard#token=<jwt>`
7. Frontend extracts token from URL hash, stores in localStorage (web) / secure-store (mobile)

> **Limitation:** the callback redirects to a single `FRONTEND_URL` (web URL or the mobile deep link `frequency://`), so Google OAuth serves only one client at a time. The redirect URI is built from `APP_URL`, so OAuth does not work against a local BE — use email + password locally.

## Design System (Web — mirrored on mobile)

| Token | Value |
|---|---|
| Primary color | `#2bee79` (bright green) |
| Background light | `#f6f8f7` |
| Background dark | `#102217` (dark green) |
| Font | Lexend (Google Fonts) |
| Dark mode | Class-based (`dark:`) |
| Icons | Material Symbols Outlined (web font) → `MaterialIcons` on mobile |

## API Response Types

```typescript
interface ApiUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
}

interface ApiAction {
    id: string;
    userId: string;
    name: string;
    icon: string;          // material icon name
    color: string;         // css class e.g. "bg-primary"
    remindersEnabled: boolean;
    reminderTime: string | null;  // "HH:MM"
    createdAt: string;
}

interface ApiLog {
    log: {
        id: string;
        userId: string;
        actionId: string | null;
        loggedAt: string;  // ISO-8601
        note: string | null;
        createdAt: string;
    };
    action: ApiAction | null;
}
```
