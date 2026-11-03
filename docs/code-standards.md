# Frequency — Code Standards

## Language & Tooling

- **Language:** TypeScript strict mode (both frontend and backend)
- **Runtime:** Node.js ESM (`"type": "module"`)
- **Linting:** ESLint with react-hooks + react-refresh plugins
- **Formatting:** Default Vite/ESLint config (no Prettier configured)

## File Naming

| Context | Convention | Examples |
|---|---|---|
| React components | PascalCase | `ActionItem.tsx`, `CalendarGrid.tsx` |
| Mobile components | kebab-case | `action-item.tsx`, `calendar-grid.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.tsx`, `use-auth.tsx` (mobile) |
| Utility/lib files | camelCase | `api.ts`, `db.ts`, `jwt.ts` |
| Pages (web) | PascalCase + `Page` suffix | `DashboardPage.tsx` |
| Screens (mobile) | lowercase (expo-router) | `dashboard.tsx`, `login.tsx` |

## React Patterns

### Component Structure
```tsx
// 1. Imports
// 2. Types / interfaces
// 3. Constants (outside component)
// 4. Component function
// 5. Hooks (useRequireAuth, useNavigate, useAuth, useState, useEffect)
// 6. Handlers
// 7. Derived / memoized values
// 8. Return JSX
// 9. Default export
```

### Data Fetching Pattern
```tsx
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    api.list()
        .then(setData)
        .finally(() => setLoading(false));
}, []);
```

For dependent fetches, use `useCallback` with dependencies and `useEffect` calling it:
```tsx
const load = useCallback(async () => { ... }, [dep1, dep2]);
useEffect(() => { load(); }, [load]);
```

### Auth Guard
Every authenticated screen calls `useRequireAuth()` as the first hook:
```tsx
export const MyPage = () => {
    useRequireAuth(); // redirects to /login if no token
    // ...
};
```

## API Client (`lib/api.ts`)

- All API calls go through `apiFetch<T>(path, options)` — never raw `fetch`
- Throws `ApiError` (with `.status`) on non-OK responses
- JWT token is injected automatically via `Authorization: Bearer <token>` header
- Base URL from env var: `VITE_API_URL` (web) / `EXPO_PUBLIC_API_URL` (mobile)

```typescript
// ✅ Correct
const actions = await actionsApi.list();

// ❌ Never do raw fetch inside components
const res = await fetch('/api/actions');
```

## Backend Patterns (Hono)

### Route Convention
```typescript
// Each route group is its own Hono instance, registered in index.ts
export const actionRoutes = new Hono();
actionRoutes.get('/', authMiddleware, handler);
actionRoutes.post('/', authMiddleware, handler);
```

### Auth Middleware
All protected routes use `authMiddleware` which extracts `userId` into context:
```typescript
const userId = c.get('userId'); // string, guaranteed present after middleware
```

### Response Format
```typescript
// Success
return c.json({ data }, 200 | 201);

// Error
return c.json({ error: 'Human readable message' }, 400 | 401 | 404 | 409);
```

## Modularization Rules

- Files >200 LOC should be split by concern
- Current exceptions: `CalendarPage.tsx` (269 LOC), `CreateActionPage.tsx`, `LoginPage.tsx` on web — split them when next touched
- Mobile screens: keep screens thin (API calls + layout only); extract complex logic to custom hooks

## Error Handling

### Frontend
```tsx
try {
    await someApi.call();
} catch (err) {
    setError(err instanceof Error ? err.message : 'Something went wrong');
}
```

### Backend
```typescript
// Wrap DB operations, return structured errors
const user = await db.select()...get();
if (!user) return c.json({ error: 'Not found' }, 404);
```

## Imports

- Use relative imports within the project (`'../lib/api'`)
- No barrel `index.ts` files — import directly from source file
- Types imported with `type` keyword: `import { type ApiUser } from '../lib/api'`

## Comments

Use section dividers for long files:
```typescript
// ─── Section Name ──────────────────────────────────────────────────────────────
```

Use inline comments sparingly — only for non-obvious logic.

## Mobile-Specific Standards (React Native)

- Use `Pressable` (not `TouchableOpacity`) for interactive elements
- Always wrap screen root in `SafeAreaView` or use `useSafeAreaInsets`
- Use `KeyboardAvoidingView` on screens with text inputs
- No inline styles — use NativeWind `className` prop always
- Icons: `@expo/vector-icons` `MaterialIcons` — follow icon mapping in design guidelines
- Token storage: `expo-secure-store` — never `AsyncStorage` for JWT
