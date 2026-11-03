import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

async function authHeaders(page: Page) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    return { Authorization: `Bearer ${token}` };
}

async function createLog(page: Page, loggedAt: string) {
    const res = await page.request.post(`${API_URL}/logs`, { headers: await authHeaders(page), data: { loggedAt } });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).log.id as string;
}

async function getLoggedAt(page: Page, headers: Record<string, string>, id: string) {
    const res = await page.request.get(`${API_URL}/logs/${id}`, { headers });
    return (await res.json()).log.loggedAt as string;
}

// TimePicker buttons are named by their icon: [hour ▲, hour ▼, min ▲, min ▼, period ▲, period ▼]
const picker = (page: Page) => ({
    hourDown: page.getByRole('button', { name: 'keyboard_arrow_down' }).nth(0),
    hourUp: page.getByRole('button', { name: 'keyboard_arrow_up' }).nth(0),
    periodToggle: page.getByRole('button', { name: 'keyboard_arrow_up' }).nth(2),
});

test.describe('log times in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('regression: registering a time later than now logs it on the previous day, never in the future', async ({ page }) => {
        await registerViaUi(page);
        await page.clock.setFixedTime(new Date('2026-11-03T17:15:00.000Z')); // Nov 4, 00:15 local
        await page.goto('/register');

        // Picker starts at 12:15 AM; set 11:15 PM — "last night"
        await picker(page).hourDown.click();
        await picker(page).periodToggle.click();
        await page.getByRole('button', { name: /Save Action/ }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        const res = await page.request.get(`${API_URL}/logs`, { headers: await authHeaders(page) });
        const [row] = await res.json();
        expect(row.log.loggedAt).toBe('2026-11-03T16:15:00.000Z'); // Nov 3, 23:15 local
    });

    test('a time earlier than now stays today', async ({ page }) => {
        await registerViaUi(page);
        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/register');

        await picker(page).hourDown.click(); // 9:00 AM
        await page.getByRole('button', { name: /Save Action/ }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        const res = await page.request.get(`${API_URL}/logs`, { headers: await authHeaders(page) });
        const [row] = await res.json();
        expect(row.log.loggedAt).toBe('2026-11-03T02:00:00.000Z'); // Nov 3, 09:00 local
    });

    test('regression: edit page labels the log day correctly instead of always "Today"', async ({ page }) => {
        await registerViaUi(page);
        const today = await createLog(page, '2026-11-02T23:00:00.000Z'); // Nov 3, 06:00 local
        const yesterday = await createLog(page, '2026-11-02T05:00:00.000Z'); // Nov 2, 12:00 local
        const older = await createLog(page, '2026-10-01T02:00:00.000Z'); // Oct 1, 09:00 local
        const lastYear = await createLog(page, '2025-12-31T02:00:00.000Z'); // Dec 31 2025, 09:00 local
        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local

        const cases: [string, string][] = [
            [today, 'Today, Nov 3'],
            [yesterday, 'Yesterday, Nov 2'],
            [older, 'Oct 1'],
            [lastYear, 'Dec 31, 2025'],
        ];
        for (const [id, label] of cases) {
            await page.goto(`/edit?logId=${id}`);
            await expect(page.getByText(label, { exact: true })).toBeVisible();
        }
        await expect(page.getByText(/^Today, Oct 1$/)).toHaveCount(0);
    });

    // Keeping the date is existing behaviour (guarded here); refusing a future time is new
    test('edit keeps the log date and refuses a time in the future', async ({ page }) => {
        await registerViaUi(page);
        const older = await createLog(page, '2026-10-01T02:00:00.000Z'); // Oct 1, 09:00 local
        const today = await createLog(page, '2026-11-02T23:00:00.000Z'); // Nov 3, 06:00 local
        const headers = await authHeaders(page); // read once: saving navigates away mid-test
        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local

        // Older log: 9 AM → 10 AM keeps Oct 1
        await page.goto(`/edit?logId=${older}`);
        await expect(page.getByText('Oct 1', { exact: true })).toBeVisible();
        await picker(page).hourUp.click();
        await page.getByRole('button', { name: /Save Changes/ }).click();
        await expect.poll(() => getLoggedAt(page, headers, older)).toBe('2026-10-01T03:00:00.000Z');

        // Today's log: 6 AM → 6 PM would be in the future
        await page.goto(`/edit?logId=${today}`);
        await expect(page.getByText('Today, Nov 3', { exact: true })).toBeVisible();
        await picker(page).periodToggle.click();
        await page.getByRole('button', { name: /Save Changes/ }).click();
        await expect(page.getByText(/can't be in the future/i)).toBeVisible();
        expect(await getLoggedAt(page, headers, today)).toBe('2026-11-02T23:00:00.000Z');
    });
});
