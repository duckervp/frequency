# Frequency — Deployment Guide

## Backend (`frequency-be/`) — Vercel

### Environment Variables (set in Vercel dashboard)

```env
TURSO_URL=libsql://...           # Turso database URL
TURSO_AUTH_TOKEN=...             # Turso auth token
JWT_SECRET=...                   # Secret for JWT signing (min 32 chars)
GOOGLE_CLIENT_ID=...             # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...         # Google OAuth client secret
APP_URL=https://<app>.vercel.app # Backend's own URL (used for redirect URIs)
FRONTEND_URL=https://<web-app>.vercel.app  # Google OAuth redirect target (web URL, or frequency:// for mobile)
ALLOWED_ORIGINS=*                # CORS allowed origins
```

### Deploy

```bash
cd frequency-be
# First deploy
vercel --prod

# Subsequent deploys (auto via Vercel Git integration)
git push origin main
```

### Database Migrations

```bash
cd frequency-be
npx drizzle-kit export   # Print schema as SQL — read-only sanity check
npm run db:push          # Push schema changes to Turso (review the diff first)
npm run db:generate      # Generate migration files from schema changes
npm run db:migrate       # Run migrations
```

> **Warning:** There is only one Turso database (local `.env` = production), and there is no migration history — the DB was created with `db:push`. The first `db:generate` will emit `CREATE TABLE` for tables that already exist; do not `db:migrate` it. Use `db:push` until migrations are baselined.

---

## Mobile App (`frequency-mobile/`) — EAS Build

### Prerequisites

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login` (requires Expo account)
3. Configure: `eas build:configure` (creates `eas.json`)

### Environment Variables

Create `frequency-mobile/.env.local`:
```env
EXPO_PUBLIC_API_URL=https://<app>.vercel.app/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=<ios-client-id-from-google-cloud-console>
```

### Development Build (Expo Go)

For live development testing on iPhone without building an IPA:
```bash
cd frequency-mobile
npx expo start
# Scan QR code with iPhone Camera
# Opens in Expo Go app (install from App Store)
```

### Preview IPA Build (EAS Cloud)

Builds in the cloud — no Mac required:
```bash
eas build --platform ios --profile preview
# Wait ~10-15 minutes
# Download .ipa from https://expo.dev/accounts/<user>/projects/<app>/builds
```

### eas.json Profiles

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    }
  }
}
```

---

## Installing IPA on iPhone 13 (Windows — Sideloadly)

### One-time Setup
1. Download [Sideloadly](https://sideloadly.io/) for Windows
2. Install [iTunes](https://www.apple.com/itunes/) for Windows (needed for USB driver)
3. Connect iPhone 13 via USB → "Trust This Computer" on iPhone

### Install Steps (repeat every 7 days)
1. Open Sideloadly
2. Connect iPhone 13 via USB (should appear in device list)
3. Drag `.ipa` file into Sideloadly window
4. Enter Apple ID (used for signing — free account works)
5. Click **Start**
6. On iPhone: **Settings → General → VPN & Device Management → [your Apple ID] → Trust**
7. Open Frequency app

> **Note:** Free Apple ID signing expires every 7 days. Repeat the Sideloadly install to re-sign. The app data is preserved between re-signs.

---

## Google OAuth Setup (Required for Mobile)

### Google Cloud Console Steps
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Open the Frequency project (same one used for web)
3. Navigate to **APIs & Services → Credentials**
4. Create new **OAuth 2.0 Client ID**:
   - Type: **iOS**
   - Bundle ID: `com.frequency.app` (must match `app.json`)
5. Copy the **Client ID** → set as `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` in `.env.local`

### Backend: `FRONTEND_URL`
The Google OAuth callback in `routes/auth.ts` redirects to `${FRONTEND_URL}/dashboard#token=<jwt>`. Only one value is supported:

- Web (default, primary client): `FRONTEND_URL=https://<web-app>.vercel.app`
- Mobile: `FRONTEND_URL=frequency://` → `frequency://dashboard#token=<jwt>`, handled by `expo-auth-session`

Switching it to mobile breaks Google login on web, and vice versa. Supporting both needs a BE change (e.g. pass the target client in the OAuth `state`).

---

## Web Frontend (`frequency/`) — Vercel

Primary client. Set `VITE_API_URL=https://<app>.vercel.app/api` in the Vercel project env.

```bash
cd frequency
npm run build     # vite build
vercel --prod     # deploy to Vercel
```

The web app's `vercel.json` routes all non-API paths to `index.html` (SPA routing).
