# Frequency — System Architecture

## High-Level Diagram

```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ frequency/ (Web) — PRIMARY   │   │ frequency-mobile/ (iOS)      │
│ React 19 + Vite              │   │ Expo 54 + React Native       │
│ TailwindCSS 4                │   │ NativeWind 4, expo-router    │
│ react-router-dom             │   │ expo-secure-store (JWT)      │
│ localStorage (JWT)           │   │ synced from web              │
│ Deployed: Vercel             │   │ EAS Build + Sideloadly       │
└──────────────┬───────────────┘   └──────────────┬───────────────┘
               │      HTTPS REST API, Bearer JWT   │
               └────────────────┬──────────────────┘
┌───────────────────────────────▼──┐
│   frequency-be/ (Backend)        │
│   Hono framework (TypeScript)    │
│   Drizzle ORM                    │
│   Turso (libSQL / SQLite edge)   │
│   Deployed: Vercel               │
└──────────────────────────────────┘
             │
┌────────────▼──────────────┐
│   Turso Database (cloud)  │
│   Tables: users, actions, │
│   action_logs             │
└───────────────────────────┘
```

## Backend API (`frequency-be/`)

### Base URL
```
https://<app>.vercel.app/api
```

### Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Create account (email + password) |
| POST | `/auth/login` | ❌ | Login → returns JWT |
| GET | `/auth/google` | ❌ | Redirect to Google OAuth |
| GET | `/auth/google/callback` | ❌ | Google OAuth callback → redirects with `#token=...` |
| GET | `/auth/me` | ✅ | Get current user profile |
| GET | `/actions` | ✅ | List user's actions |
| GET | `/actions/:id` | yes | One of the user's actions (404 if missing or someone else's) |
| POST | `/actions` | ✅ | Create action |
| PUT | `/actions/:id` | ✅ | Update action |
| DELETE | `/actions/:id` | ✅ | Delete action |
| GET | `/logs` | ✅ | List logs (supports `?from=ISO&to=ISO` — a local day's bounds from the client, `?last24h=true`; legacy `?date=YYYY-MM-DD` matches the UTC day) |
| GET | `/logs/:id` | ✅ | Get single log |
| GET | `/logs/stats` | ✅ | Today's count + date label; pass `?from=&to=` for the client's local today (without them: UTC day) |
| GET | `/logs/streak` | yes | `{ streak }`: consecutive local days with a log back from today; `?tz=` IANA zone (required), `&today=YYYY-MM-DD` (client's local today), `&actionId=` |
| POST | `/logs` | ✅ | Create log entry |
| PUT | `/logs/:id` | ✅ | Update log entry |
| DELETE | `/logs/:id` | ✅ | Delete log entry |
| GET | `/health` | ❌ | Health check |

### Auth Flow

```
Client                Backend                Google
  │──POST /auth/login──▶│                      │
  │◀──{ token, user }───│                      │
  │                      │                      │
  │──GET /auth/google───▶│──redirect OAuth URL─▶│
  │                      │◀──code───────────────│
  │                      │──exchange code────────│
  │◀──redirect #token=...│                      │
```

JWT is signed with `JOSE` library. Token stored in `localStorage` (`freq_token`) on web and in `expo-secure-store` on mobile.

### Database Schema

```
users
  id TEXT PK          (nanoid)
  email TEXT UNIQUE
  password_hash TEXT  (null for Google-only users)
  name TEXT
  avatar_url TEXT
  google_id TEXT UNIQUE
  created_at TEXT

actions
  id TEXT PK          (nanoid)
  user_id TEXT FK→users
  name TEXT
  icon TEXT           (material icon name)
  color TEXT          (tailwind class)
  reminders_enabled BOOLEAN
  reminder_time TEXT  (HH:MM)
  created_at TEXT

action_logs
  id TEXT PK          (nanoid)
  user_id TEXT FK→users
  action_id TEXT FK→actions (nullable, SET NULL on delete)
  logged_at TEXT      (ISO-8601 datetime)
  note TEXT
  created_at TEXT
```

## Web App (`frequency/`)

React Router SPA. Routes: `/login`, `/dashboard`, `/log`, `/calendar`, `/settings`, `/manage-actions`, `/create`, `/register?actionId=`, `/edit?logId=` — see `codebase-summary.md` for the page ↔ API table. Auth via `useAuth` context (`src/hooks/useAuth.tsx`), API calls via `src/lib/api.ts`.

## Mobile App (`frequency-mobile/`)

Mirrors the web app; features are ported after they are finished on web.

### Navigation Structure (expo-router)

```
app/
  _layout.tsx             Root: font loading, AuthProvider, dark mode
  index.tsx               Redirect → login or dashboard
  (auth)/
    login.tsx             Login + Register screen
  (tabs)/
    _layout.tsx           Bottom tab bar (4 tabs)
    dashboard.tsx         🏠 Quick actions + last 24h feed
    log.tsx               📋 Date-filtered log with FAB
    calendar.tsx          📅 Month grid + day detail + stats
    settings.tsx          ⚙️  Profile + settings menu
  create.tsx              Create new action
  register.tsx            Log an action occurrence
  edit.tsx                Edit existing log entry
  manage-actions.tsx      CRUD list of actions
```

### Shared Logic Modules

| Module | Purpose |
|---|---|
| `src/lib/api.ts` | fetch wrapper, typed API methods (auth/actions/logs) |
| `src/hooks/use-auth.tsx` | AuthContext provider, JWT persistence, Google OAuth |
| `src/data/mock-data.ts` | Default action stubs for empty state |

### State Management

No global store — uses React Context for auth only:
- `AuthContext` via `use-auth.tsx` provides `user`, `token`, `login`, `register`, `loginWithGoogle`, `logout`
- Page-level `useState` + `useEffect` for API data
- `useCallback` for stable fetch functions

## Environment Variables

### Web (`frequency/.env.local`)
```env
VITE_API_URL=http://localhost:3001/api      # local BE (default when developing)
# VITE_API_URL=https://<app>.vercel.app/api # deployed BE (needed for Google OAuth)
```

### Mobile (`frequency-mobile/.env.local`)
```env
EXPO_PUBLIC_API_URL=https://<app>.vercel.app/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=<ios-oauth-client-id>
```

### Backend (`frequency-be/.env`)
```env
TURSO_URL=libsql://...
TURSO_AUTH_TOKEN=...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APP_URL=https://<app>.vercel.app
FRONTEND_URL=<web URL or deep-link-scheme://>   # one client only for Google OAuth
ALLOWED_ORIGINS=*
```

Local `.env` points at the same Turso database as production.
