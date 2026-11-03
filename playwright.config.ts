import { defineConfig, devices } from '@playwright/test';

// E2E runs the real web app against a real BE, both on test-only ports:
//   BE  :3101 — ../frequency-be `npm run test:server` (fresh local SQLite DB, never Turso)
//   web :5174 — Vite with VITE_API_URL pointing at the test BE
// Requires ../frequency-be to be checked out next to this repo (D:\vibe\freq layout).
const BE_URL = 'http://localhost:3101';
const WEB_URL = 'http://localhost:5174';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: WEB_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: [
        {
            command: 'npm --prefix ../frequency-be run test:server',
            url: `${BE_URL}/api/health`,
            // Never reuse: an already-running server on this port might not be on the test DB.
            reuseExistingServer: false,
            timeout: 60_000,
        },
        {
            command: 'npx vite --port 5174 --strictPort',
            url: WEB_URL,
            env: { VITE_API_URL: `${BE_URL}/api` },
            reuseExistingServer: false,
            timeout: 60_000,
        },
    ],
});
