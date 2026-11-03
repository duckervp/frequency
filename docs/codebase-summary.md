# Frequency — Codebase Summary

## Repository Layout

```
d:\antigravity\
├── frequency/              Legacy web app (React + Vite) — reference only
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
│       ├── server.ts       Hono app entry
│       ├── index.ts        Route registration + CORS
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
└── frequency-mobile/       NEW React Native app (Expo) — active
    ├── plans/
    │   └── react-native-migration-plan.md
    └── app/                (to be created)
```

## Web Frontend (`frequency/src/`) — Reference

### Pages

| File | Route | Key APIs Used |
|---|---|---|
| `LoginPage.tsx` | `/login` | `authApi.login`, `authApi.register`, `authApi.loginWithGoogle` |
| `DashboardPage.tsx` | `/dashboard` | `actionsApi.list`, `logsApi.list({ last24h: true })` |
| `LogPage.tsx` | `/log` | `logsApi.list({ date })`, `logsApi.stats`, `logsApi.remove` |
| `CalendarPage.tsx` | `/calendar` | `logsApi.list`, `actionsApi.list` |
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
| `server.ts` | Hono server entry (port 3000) |
| `index.ts` | Route registration, CORS config, `/health` |
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

> **Mobile OAuth Change Needed:** The current redirect-to-hash approach won't work in a native app. Mobile will use `expo-auth-session` with a deep link callback instead.

## Design System (Web — for Mobile Reference)

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
