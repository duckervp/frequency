import { expect, type Page } from '@playwright/test';

let counter = 0;

export function uniqueEmail() {
    return `e2e${Date.now()}-${++counter}@test.local`;
}

/** Registers a new account through the login page and lands on the dashboard. */
export async function registerViaUi(page: Page, name = 'E2E User') {
    const email = uniqueEmail();
    const password = 'password123';
    await page.goto('/login');
    await page.getByRole('button', { name: 'Create new account' }).click();
    await page.getByPlaceholder('Your name').fill(name);
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    return { email, password, name };
}
