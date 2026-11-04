import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

test('Personal Information changes the display name everywhere', async ({ page }) => {
    const user = await registerViaUi(page, 'Old Name');
    await page.goto('/settings');
    await page.getByText('Personal Information').click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText(user.email)).toBeVisible();

    const name = page.getByLabel('Display name');
    await expect(name).toHaveValue('Old Name');
    await name.fill('New Name');
    await page.getByRole('button', { name: 'Save name' }).click();
    await expect(page.getByText('Name saved')).toBeVisible();

    await page.goto('/settings');
    await expect(page.getByText('New Name', { exact: true })).toBeVisible();
    // Survives a reload: stored, not only in memory
    await page.reload();
    await expect(page.getByText('New Name', { exact: true })).toBeVisible();
});

test('Personal Information changes the password, and only with the current one', async ({ page }) => {
    const user = await registerViaUi(page);
    await page.goto('/profile');

    await page.getByLabel('Current password').fill('wrong-password');
    await page.getByLabel('New password', { exact: true }).fill('password456');
    await page.getByLabel('Confirm new password').fill('password456');
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText('Current password is incorrect')).toBeVisible();

    await page.getByLabel('Current password').fill(user.password);
    await page.getByLabel('Confirm new password').fill('different');
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText('The new passwords do not match')).toBeVisible();

    await page.getByLabel('Confirm new password').fill('password456');
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText('Password changed')).toBeVisible();

    await page.goto('/settings');
    await page.getByRole('button', { name: /log out/i }).click();
    await page.getByRole('button', { name: /continue with email/i }).click();
    await page.getByPlaceholder('Email address').fill(user.email);
    await page.getByPlaceholder('Password').fill('password456');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
});
