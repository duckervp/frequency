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
Load data with `useLoad` (`src/hooks/useLoad.ts`); never a hand-written `useEffect` + `.then().finally()` without error handling.
```tsx
const actions = useLoad(actionsApi.list);                 // stable module function
const loadDay = useCallback(() => logsApi.list(range), [range]);
const day = useLoad(loadDay);                             // reloads when range changes; late responses are ignored

{day.error ? <ErrorState message={day.error} onRetry={day.reload} />
    : day.loading ? <Skeleton />
    : <List rows={day.data} />}
```
- Never show default or empty data after a failed load (e.g. the Dashboard's starter actions only appear when the list really is empty).
- Mutations (delete, save) go through `useAsyncAction().run(...)` and show `error` with `<ErrorState />`; update local data with `setData` instead of refetching.
- User-facing text for any caught error comes from `errorMessage(err)` in `lib/api.ts`.

### Icons
Every icon name lives in `src/lib/icons.ts`; `vite.config.ts` writes that list into the Material Symbols `icon_names` in `index.html` (the full font is 1 MB). Using a new icon means adding it there. Render an icon stored on an action with `actionIcon(name)`: it maps mobile names (`water-drop`) and shows a neutral icon for unknown names instead of text. `e2e/ui-fixes.spec.ts` fails if any icon renders as text. Images live in `public/images/` as WebP; do not hotlink.

### Page Layout
Every signed-in page renders `PageLayout` with a `TopBar` (`src/components/PageLayout.tsx`, `src/components/TopBar.tsx`); do not build a page wrapper or header by hand.
```tsx
<PageLayout
    header={<TopBar title="Settings" left={<TopBarButton icon="arrow_back_ios_new" label="Back" onClick={() => navigate(-1)} />} />}
>
    <main className="flex-1 px-4 pb-32">...</main>
    <BottomNav activeTab="settings" />
</PageLayout>
```
- `PageLayout` owns the background, the centered `max-w-md` column and the sticky top bar. Never add an `overflow-*` class to it or around the top bar: that creates a scroll container and the sticky bar scrolls away (regression spec `e2e/layout.spec.ts`).
- Fixed elements (`BottomNav`, floating save buttons) go inside as children.
- Icon buttons in the bar use `TopBarButton` with a `label` (accessible name).

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
See Data Fetching Pattern: `useLoad` for loads, `useAsyncAction` for mutations, `errorMessage(err)` for the text. A form that keeps its own error state still uses `errorMessage`:
```tsx
try {
    await someApi.call();
} catch (err) {
    setError(errorMessage(err));
}
```

### Backend
Request bodies are read and checked with `src/lib/validate.ts` (`jsonBody`, `text`, `instant`, ...); validation helpers throw a 400 that `app.onError` returns as `{ error }`.
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
