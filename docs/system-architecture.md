# Frequency — System Architecture

## High-Level Diagram

```
┌──────────────────────────────────┐
│   frequency-mobile/ (iOS App)    │
│   Expo SDK + React Native        │
│   NativeWind v4 (Tailwind CSS)   │
│   expo-router (file navigation)  │
│   expo-secure-store (JWT token)  │
│   expo-auth-session (Google OAuth│
└────────────┬─────────────────────┘
             │ HTTPS REST API
             │ Bearer JWT
┌────────────▼─────────────────────┐
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
| POST | `/actions` | ✅ | Create action |
| PUT | `/actions/:id` | ✅ | Update action |
| DELETE | `/actions/:id` | ✅ | Delete action |
| GET | `/logs` | ✅ | List logs (supports `?date=YYYY-MM-DD`, `?last24h=true`) |
| GET | `/logs/:id` | ✅ | Get single log |
| GET | `/logs/stats` | ✅ | Today's count + date label |
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

JWT is signed with `JOSE` library. Token stored in `expo-secure-store` on mobile.

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

## Mobile App (`frequency-mobile/`)

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
FRONTEND_URL=<deep-link-scheme>://
ALLOWED_ORIGINS=*
```
