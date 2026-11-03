import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

/** Creates logs at the given ISO instants via the API, as the signed-in user. Quick logs when no actionId. */
async function createLogs(page: Page, instants: string[], actionId?: string) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    for (const loggedAt of instants) {
        const res = await page.request.post(`${API_URL}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { loggedAt, actionId },
        });
        expect(res.ok()).toBeTruthy();
    }
}

async function createAction(page: Page, name: string): Promise<string> {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    const res = await page.request.post(`${API_URL}/actions`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { name },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).id;
}

async function selectFilter(page: Page, current: string, next: string) {
    const byLabel = (label: string) =>
        page.getByRole('button').filter({ has: page.getByText(label, { exact: true }) });
    await byLabel(current).click();
    await byLabel(next).click();
}

function stat(page: Page, label: string) {
    return page.getByText(label).locator('xpath=..').locator('span.text-3xl');
}

const total = (page: Page) => stat(page, 'Total this month');
const streak = (page: Page) => stat(page, 'Current Streak');

test.describe('calendar month range in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('fetches logs by month range, never the whole history', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, ['2026-11-03T01:00:00.000Z']);

        const logRequests: URL[] = [];
        page.on('request', (req) => {
            const url = new URL(req.url());
            if (url.pathname === '/api/logs') logRequests.push(url);
        });

        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/calendar');
        await expect(total(page)).toHaveText('1');
        await page.getByRole('button', { name: 'Previous month' }).click();
        await expect(page.getByText('October 2026')).toBeVisible();
        await expect(total(page)).toHaveText('0');

        expect(logRequests.length).toBeGreaterThan(0);
        for (const url of logRequests) {
            expect(url.searchParams.get('from'), url.search).toBeTruthy();
            expect(url.searchParams.get('to'), url.search).toBeTruthy();
        }
    });

    test('streak keeps counting across the start of the month', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, [
            '2026-10-30T01:00:00.000Z', // Oct 30, 08:00 local
            '2026-10-31T01:00:00.000Z',
            '2026-11-01T01:00:00.000Z',
            '2026-11-02T01:00:00.000Z',
            '2026-11-03T01:00:00.000Z', // Nov 3, 08:00 local
        ]);

        const logRanges: string[] = [];
        page.on('request', (req) => {
            const url = new URL(req.url());
            if (url.pathname === '/api/logs') logRanges.push(url.searchParams.get('from') ?? '(none)');
        });

        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/calendar');
        await expect(total(page)).toHaveText('3');
        await expect(streak(page)).toHaveText('5');
        // The streak comes from the BE; October's logs are not downloaded to count it
        expect(logRanges.every((from) => from >= '2026-10-31T17:00:00.000Z'), logRanges.join(', ')).toBe(true);

        // Looking at another month does not change the streak
        await page.getByRole('button', { name: 'Previous month' }).click();
        await expect(total(page)).toHaveText('2');
        await expect(streak(page)).toHaveText('5');
    });

    test('streak across the month start follows the action filter', async ({ page }) => {
        await registerViaUi(page);
        const run = await createAction(page, 'Run');
        const read = await createAction(page, 'Read');
        await createLogs(page, [
            '2026-10-31T01:00:00.000Z',
            '2026-11-01T01:00:00.000Z',
            '2026-11-02T01:00:00.000Z',
            '2026-11-03T01:00:00.000Z',
        ], run);
        await createLogs(page, ['2026-10-30T01:00:00.000Z'], read);

        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/calendar');
        await expect(streak(page)).toHaveText('5');

        await selectFilter(page, 'All Actions', 'Run');
        await expect(streak(page)).toHaveText('4');
    });

    test('logs just after local midnight on the 1st belong to the new month, across a year change', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, [
            '2026-12-31T16:30:00.000Z', // Dec 31, 23:30 local
            '2026-12-31T17:30:00.000Z', // Jan 1, 00:30 local (still Dec 31 in UTC)
            '2027-01-02T01:00:00.000Z', // Jan 2, 08:00 local
        ]);

        await page.clock.setFixedTime(new Date('2027-01-02T03:00:00.000Z')); // Jan 2, 10:00 local
        await page.goto('/calendar');
        await expect(page.getByText('January 2027')).toBeVisible();
        await expect(total(page)).toHaveText('2');
        await expect(streak(page)).toHaveText('3');

        await page.getByRole('button', { name: 'Previous month' }).click();
        await expect(page.getByText('December 2026')).toBeVisible();
        await expect(total(page)).toHaveText('1');
    });

    test('a failing streak request does not hide the month total or leave a skeleton', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, ['2026-11-03T01:00:00.000Z']);
        await page.route('**/api/logs/streak**', (route) => route.fulfill({ status: 500, body: '{"error":"boom"}' }));

        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/calendar');
        await expect(total(page)).toHaveText('1');
        await expect(streak(page)).toHaveText('0');
    });

    test('deleting a log updates the month total and the streak', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, [
            '2026-11-02T01:00:00.000Z', // Nov 2, 08:00 local
            '2026-11-03T01:00:00.000Z', // Nov 3, 08:00 local
        ]);

        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/calendar');
        await expect(total(page)).toHaveText('2');
        await expect(streak(page)).toHaveText('2');

        // Today is selected by default, so its log is listed
        page.once('dialog', (dialog) => dialog.accept());
        await page.getByRole('button', { name: 'delete' }).click();
        await expect(total(page)).toHaveText('1');
        await expect(streak(page)).toHaveText('0');
    });
});
