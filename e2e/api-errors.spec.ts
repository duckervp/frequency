import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

async function createLog(page: Page, note: string, actionId?: string) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    const res = await page.request.post(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { loggedAt: new Date(Date.now() - 60_000).toISOString(), note, actionId },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).log.id as string;
}

/** Makes matching API calls fail with a 500 until the returned function is called */
async function failApi(page: Page, pattern: string, method?: string) {
    const handler = (route: import('@playwright/test').Route) =>
        !method || route.request().method() === method
            ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' })
            : route.fallback();
    await page.route(pattern, handler);
    return () => page.unroute(pattern, handler);
}

/** Collects uncaught errors (e.g. unhandled promise rejections) thrown by the page */
function pageErrors(page: Page) {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

test('regression: a failed load on the dashboard shows an error with retry, not the default actions', async ({ page }) => {
    await registerViaUi(page);
    await createLog(page, 'real log');
    const errors = pageErrors(page);
    const restore = await failApi(page, '**/api/actions');

    await page.goto('/dashboard');
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByText('Take Medicine')).toHaveCount(0);

    await restore();
    await page.getByRole('button', { name: 'Try again' }).first().click();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    await expect(page.getByText('real log')).toBeVisible();
    expect(errors).toEqual([]);
});

test('regression: a failed delete on the Log page keeps the row and says so', async ({ page }) => {
    await registerViaUi(page);
    await createLog(page, 'keep me');
    const errors = pageErrors(page);

    await page.goto('/log');
    await expect(page.getByText('1 actions completed')).toBeVisible();
    await failApi(page, '**/api/logs/*', 'DELETE');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'delete' }).click();

    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByText('keep me')).toBeVisible();
    await expect(page.getByText('1 actions completed')).toBeVisible();
    expect(errors).toEqual([]);
});

test('regression: the edit page explains a missing or unknown log instead of loading forever', async ({ page }) => {
    await registerViaUi(page);
    const errors = pageErrors(page);

    await page.goto('/edit');
    await expect(page.getByText(/log could not be found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /save changes/i })).toHaveCount(0);

    await page.goto('/edit?logId=does-not-exist');
    await expect(page.getByText(/log could not be found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /save changes/i })).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('regression: Manage Actions shows a load error, not "No actions yet"', async ({ page }) => {
    await registerViaUi(page);
    const errors = pageErrors(page);
    await failApi(page, '**/api/actions');

    await page.goto('/manage-actions');
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByText(/no actions yet/i)).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('regression: the calendar day list shows a load error instead of "No logs recorded"', async ({ page }) => {
    await registerViaUi(page);
    const errors = pageErrors(page);
    await page.route('**/api/logs?from=*', (route) => {
        const url = new URL(route.request().url());
        const days = (new Date(url.searchParams.get('to')!).getTime() - new Date(url.searchParams.get('from')!).getTime()) / 864e5;
        return days <= 1 ? route.fulfill({ status: 500, body: '{"error":"boom"}' }) : route.fallback();
    });

    await page.goto('/calendar');
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByText(/no logs recorded/i)).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('regression: Register with an action that fails to load says so instead of "Quick Log"', async ({ page }) => {
    await registerViaUi(page);
    const errors = pageErrors(page);
    await failApi(page, '**/api/actions/*');

    await page.goto('/register?actionId=abc');
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick Log' })).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('regression: a month that failed and then loads does not keep its error banner', async ({ page }) => {
    await registerViaUi(page);
    await createLog(page, 'this month');
    let failures = 1;
    await page.route('**/api/logs?from=*', (route) => {
        const url = new URL(route.request().url());
        const days = (new Date(url.searchParams.get('to')!).getTime() - new Date(url.searchParams.get('from')!).getTime()) / 864e5;
        if (days > 1 && failures > 0) {
            failures--;
            return route.fulfill({ status: 500, body: '{"error":"boom"}' });
        }
        return route.fallback();
    });

    await page.goto('/calendar');
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await page.getByRole('button', { name: 'Previous month' }).click();
    await page.getByRole('button', { name: 'Next month' }).click();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    await expect(page.getByText('Total this month').locator('xpath=..').locator('span.text-3xl')).toHaveText('1');
});

test("regression: a failed streak after changing the filter does not show the previous filter's streak", async ({ page }) => {
    await registerViaUi(page);
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    const action = await (await page.request.post(`${API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` }, data: { name: 'Run' } })).json();
    await createLog(page, 'quick');

    await page.goto('/calendar');
    const streak = page.getByText('Current Streak').locator('xpath=..').locator('span.text-3xl');
    await expect(streak).toHaveText('1');

    await failApi(page, '**/api/logs/streak**');
    const byLabel = (label: string) => page.getByRole('button').filter({ has: page.getByText(label, { exact: true }) });
    await byLabel('All Actions').click();
    await byLabel('Run').click();
    expect(action.id).toBeTruthy();
    await expect(streak).toHaveText('0');
});

test("regression: the server's reason is shown when it rejects a save", async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/create');
    await page.getByPlaceholder('e.g., Read Book').fill('x'.repeat(101));
    await page.getByRole('button', { name: 'Create Action' }).click();
    await expect(page.getByText('name must be at most 100 characters')).toBeVisible();
    await expect(page).toHaveURL(/\/create/);
});
