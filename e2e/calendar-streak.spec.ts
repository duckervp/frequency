import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

/** Creates quick logs (no action) at the given ISO instants via the API, as the signed-in user. */
async function createLogs(page: Page, instants: string[]) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    for (const loggedAt of instants) {
        const res = await page.request.post(`${API_URL}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { loggedAt },
        });
        expect(res.ok()).toBeTruthy();
    }
}

function streakValue(page: Page) {
    return page.getByText('Current Streak').locator('xpath=..').locator('span.text-3xl');
}

test.describe('streak in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('regression: streak counts local days, not UTC days', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, [
            '2026-11-02T23:00:00.000Z', // Nov 3, 06:00 local
            '2026-11-02T05:00:00.000Z', // Nov 2, 12:00 local
            '2026-11-01T05:00:00.000Z', // Nov 1, 12:00 local
        ]);

        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/calendar');
        await expect(streakValue(page)).toHaveText('3');
    });
});

test.describe('streak in UTC-5', () => {
    test.use({ timezoneId: 'America/New_York' });

    test('regression: evening log counts for today, not tomorrow (UTC)', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, [
            '2026-11-04T01:00:00.000Z', // Nov 3, 20:00 local
        ]);

        await page.clock.setFixedTime(new Date('2026-11-04T02:00:00.000Z')); // Nov 3, 21:00 local
        await page.goto('/calendar');
        await expect(streakValue(page)).toHaveText('1');
    });
});
