import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

async function authHeaders(page: Page) {
    return { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('freq_token'))}` };
}

async function createAction(page: Page, name: string, color?: string) {
    const res = await page.request.post(`${API_URL}/actions`, { headers: await authHeaders(page), data: { name, color } });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).id as string;
}

test('regression: no misleading "Encrypted" or "synced" text, and no top-bar button that does nothing', async ({ page }) => {
    await registerViaUi(page);
    const res = await page.request.post(`${API_URL}/logs`, { headers: await authHeaders(page), data: { loggedAt: new Date(Date.now() - 60_000).toISOString() } });
    const logId = (await res.json()).log.id;

    await page.goto(`/edit?logId=${logId}`);
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
    await expect(page.getByText('Encrypted', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/synced across your devices/i)).toHaveCount(0);

    for (const path of ['/log', '/calendar']) {
        await page.goto(path);
        await expect(page.locator('header')).toBeVisible();
        await expect(page.getByRole('button', { name: 'More', exact: true })).toHaveCount(0);
    }
});

test('regression: the color picked for an action is shown wherever the action appears', async ({ page }) => {
    await registerViaUi(page);
    const id = await createAction(page, 'Jog', 'bg-orange-400');
    await page.request.post(`${API_URL}/logs`, { headers: await authHeaders(page), data: { actionId: id, loggedAt: new Date(Date.now() - 60_000).toISOString() } });

    for (const path of ['/dashboard', '/manage-actions', '/log']) {
        await page.goto(path);
        const tile = page.locator('[data-action-color]').filter({ hasText: 'book' }).first();
        await expect(tile, path).toHaveAttribute('data-action-color', 'bg-orange-400');
        const color = await tile.evaluate((el) => getComputedStyle(el).color);
        expect(color, path).not.toBe(await page.evaluate(() => {
            const probe = document.createElement('span');
            probe.className = 'text-primary';
            document.body.append(probe);
            return getComputedStyle(probe).color;
        }));
    }
});

test('regression: the dashboard shows every action and its search finds actions too', async ({ page }) => {
    await registerViaUi(page);
    for (const name of ['Read', 'Run', 'Jog', 'Swim', 'Code', 'Sleep']) await createAction(page, name);

    await page.goto('/dashboard');
    for (const name of ['Read', 'Run', 'Jog', 'Swim', 'Code', 'Sleep']) {
        await expect(page.getByRole('button', { name: new RegExp(`^book ${name}$`) })).toBeVisible();
    }

    await page.getByPlaceholder('Search actions or habits...').fill('sw');
    await expect(page.getByRole('button', { name: /^book Swim$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^book Read$/ })).toHaveCount(0);
});

test('regression: the calendar does not move past the current month', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/calendar');
    const next = page.getByRole('button', { name: 'Next month' });
    await expect(next).toBeDisabled();
    await page.getByRole('button', { name: 'Previous month' }).click();
    await expect(next).toBeEnabled();
});
