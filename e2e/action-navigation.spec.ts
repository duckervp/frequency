import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

test('regression: saving a new action opened from the dashboard returns to the dashboard', async ({ page }) => {
    await registerViaUi(page);
    await page.getByRole('button', { name: 'New Action' }).click();
    await expect(page).toHaveURL(/\/create/);
    await page.getByPlaceholder(/e\.g\./i).fill('Stretch');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('button', { name: /Stretch/ })).toBeVisible();
});

test('regression: Back on Manage Actions opened from the dashboard returns to the dashboard, not Settings', async ({ page }) => {
    await registerViaUi(page);
    await page.getByRole('button', { name: 'Edit Grid' }).click();
    await expect(page).toHaveURL(/\/manage-actions/);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
});

test('saving a new action opened from Manage Actions returns to Manage Actions, and Back then goes to Settings', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/settings');
    await page.getByText('Manage My Actions').click();
    await page.getByRole('button', { name: 'New action' }).click();
    await page.getByPlaceholder(/e\.g\./i).fill('Stretch');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page).toHaveURL(/\/manage-actions/);
    await expect(page.getByText('Stretch')).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/settings/);
});

test('regression: Close on a New Action page opened in a new tab stays in the app', async ({ page }) => {
    await registerViaUi(page);
    const tab = await page.context().newPage();
    await tab.goto('/create');
    await tab.getByRole('button', { name: 'Close' }).click();
    await expect(tab).toHaveURL(/\/manage-actions/);
    await tab.getByRole('button', { name: 'Back' }).click();
    await expect(tab).toHaveURL(/\/settings/);
    await tab.getByRole('button', { name: 'Back' }).click();
    await expect(tab).toHaveURL(/\/dashboard/);
});

test('regression: Close while a new action is still saving goes back only once', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/settings');
    await page.getByText('Manage My Actions').click();
    await page.getByRole('button', { name: 'New action' }).click();
    await page.route('**/api/actions', async (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
    });
    await page.getByPlaceholder(/e\.g\./i).fill('Slow');
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(/\/manage-actions/);
    await page.waitForResponse((res) => res.url().endsWith('/api/actions') && res.request().method() === 'POST');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/manage-actions/);
});

test('regression: deleting a log opened from the Log page returns to the Log page', async ({ page }) => {
    await registerViaUi(page);
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    const res = await page.request.post(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { loggedAt: new Date(Date.now() - 60_000).toISOString(), note: 'to delete' },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto('/log');
    await page.getByRole('button', { name: 'edit' }).click();
    await expect(page).toHaveURL(/\/edit/);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete log' }).click();
    await expect(page).toHaveURL(/\/log$/);
    await expect(page.getByText('to delete')).toHaveCount(0);
});
