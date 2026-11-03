import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

async function authHeaders(page: Page) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    return { Authorization: `Bearer ${token}` };
}

test('regression: an expired token sends the user back to login instead of an empty dashboard', async ({ page }) => {
    await registerViaUi(page);
    await page.evaluate(() => localStorage.setItem('freq_token', 'expired.token.value'));

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('freq_token'))).toBeNull();
});

test('Google sign-in with a stale token still stored keeps the new session', async ({ page }) => {
    await registerViaUi(page);
    const fresh = await page.evaluate(() => localStorage.getItem('freq_token'));
    await page.evaluate(() => localStorage.setItem('freq_token', 'expired.token.value'));

    // Same landing the BE Google callback redirects to: a full page load, not a hash change
    await page.goto('about:blank');
    await page.goto(`/dashboard#token=${fresh}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(await page.evaluate(() => localStorage.getItem('freq_token'))).toBe(fresh);
});

test('a wrong password after logging out shows the error and stores no session', async ({ page }) => {
    // A signed-in user can no longer reach the login form (it redirects), so the wrong-password
    // path only happens without a session.
    const user = await registerViaUi(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: /log out/i }).click();

    await page.getByRole('button', { name: /continue with email/i }).click();
    await page.getByPlaceholder('Email address').fill(user.email);
    await page.getByPlaceholder('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('freq_token'))).toBeNull();
});

test('regression: double tapping Done on New Action creates one action', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/create');
    await page.getByPlaceholder('e.g., Read Book').fill('Double Tap');
    await page.getByText('Done', { exact: true }).dblclick();
    await expect(page).toHaveURL(/\/manage-actions/);

    const res = await page.request.get(`${API_URL}/actions`, { headers: await authHeaders(page) });
    const actions = (await res.json()) as { name: string }[];
    expect(actions.filter((a) => a.name === 'Double Tap')).toHaveLength(1);
});

test('regression: deleting a log on the Log page updates the today count', async ({ page }) => {
    await registerViaUi(page);
    const headers = await authHeaders(page);
    for (const note of ['first', 'second']) {
        const res = await page.request.post(`${API_URL}/logs`, {
            headers,
            data: { loggedAt: new Date(Date.now() - 60_000).toISOString(), note },
        });
        expect(res.ok()).toBeTruthy();
    }

    await page.goto('/log');
    await expect(page.getByText('2 actions completed')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'delete' }).first().click();
    await expect(page.getByText('first').or(page.getByText('second'))).toHaveCount(1);
    await expect(page.getByText('1 actions completed')).toBeVisible();
});
