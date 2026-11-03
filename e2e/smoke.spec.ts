import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

test('redirects to /login when not signed in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
});

test('register → dashboard → logout → login again', async ({ page }) => {
    const user = await registerViaUi(page, 'Smoke User');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goto('/settings');
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByRole('button', { name: /continue with email|sign in with email|email/i }).first().click();
    await page.getByPlaceholder('Email address').fill(user.email);
    await page.getByPlaceholder('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
});

test('shows an error for wrong password', async ({ page }) => {
    const user = await registerViaUi(page);
    await page.evaluate(() => localStorage.clear());

    await page.goto('/login');
    await page.getByRole('button', { name: /continue with email|sign in with email|email/i }).first().click();
    await page.getByPlaceholder('Email address').fill(user.email);
    await page.getByPlaceholder('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
});

test('create an action, log it, and see it on the dashboard', async ({ page }) => {
    await registerViaUi(page);

    await page.goto('/create');
    await page.getByPlaceholder('e.g., Read Book').fill('E2E Stretch');
    await page.getByRole('button', { name: /save|create/i }).first().click();
    await expect(page).toHaveURL(/\/manage-actions/);
    await expect(page.getByText('E2E Stretch')).toBeVisible();

    await page.goto('/dashboard');
    await page.getByRole('button', { name: /E2E Stretch/ }).click();
    await expect(page).toHaveURL(/\/register\?actionId=/);
    await page.getByPlaceholder('Add specific details about this session...').fill('10 minutes');
    await page.getByRole('button', { name: /save|log|register/i }).first().click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('10 minutes')).toBeVisible();
});
