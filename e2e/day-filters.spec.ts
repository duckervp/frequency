import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

/** Creates quick logs (no action) with a note at the given ISO instants via the API, as the signed-in user. */
async function createLogs(page: Page, logs: { loggedAt: string; note: string }[]) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    for (const data of logs) {
        const res = await page.request.post(`${API_URL}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
            data,
        });
        expect(res.ok()).toBeTruthy();
    }
}

test.describe('day filters in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('regression: Log page pills and today count use local days, not UTC days', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, [
            { loggedAt: '2026-11-02T23:00:00.000Z', note: 'early on Nov 3' }, // Nov 3, 06:00 local
            { loggedAt: '2026-11-02T05:00:00.000Z', note: 'noon on Nov 2' }, // Nov 2, 12:00 local
        ]);

        await page.clock.setFixedTime(new Date('2026-11-03T03:00:00.000Z')); // Nov 3, 10:00 local
        await page.goto('/log');
        await expect(page.getByText('Today, Nov 3')).toBeVisible();
        await expect(page.getByText('1 actions completed')).toBeVisible();
        await expect(page.getByText('early on Nov 3')).toBeVisible();
        await expect(page.getByText('noon on Nov 2')).toHaveCount(0);

        await page.getByRole('button', { name: 'Yesterday' }).click();
        await expect(page.getByText('noon on Nov 2')).toBeVisible();
        await expect(page.getByText('early on Nov 3')).toHaveCount(0);
    });
});

test.describe('day filters in UTC-5', () => {
    test.use({ timezoneId: 'America/New_York' });

    test('regression: calendar day list shows an evening log on its local day', async ({ page }) => {
        await registerViaUi(page);
        await createLogs(page, [
            { loggedAt: '2026-11-04T01:00:00.000Z', note: 'evening on Nov 3' }, // Nov 3, 20:00 local
        ]);

        await page.clock.setFixedTime(new Date('2026-11-04T02:00:00.000Z')); // Nov 3, 21:00 local
        await page.goto('/calendar');
        // Today (Nov 3) is selected by default, so its day list is shown without a click
        await expect(page.getByText('evening on Nov 3')).toBeVisible();
    });
});
