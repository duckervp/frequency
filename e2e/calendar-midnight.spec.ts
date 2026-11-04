import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

function stat(page: import('@playwright/test').Page, label: string) {
    return page.getByText(label).locator('xpath=..').locator('span.text-3xl');
}

test.describe('Calendar across local midnight in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('regression: a calendar left open moves to the new day: selected day, day list and streak', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-03T16:59:00.000Z') }); // Nov 3, 23:59 local
        await registerViaUi(page);
        const token = await page.evaluate(() => localStorage.getItem('freq_token'));
        await page.request.post(`${API_URL}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { loggedAt: '2026-11-03T03:00:00.000Z', note: 'done on Nov 3' }, // Nov 3, 10:00 local
        });

        await page.goto('/calendar');
        await expect(page.getByRole('heading', { name: 'Tuesday, November 3' })).toBeVisible();
        await expect(page.getByText('done on Nov 3')).toBeVisible();
        await expect(stat(page, 'Current Streak')).toHaveText('1');

        await page.clock.fastForward('02:00'); // Nov 4, 00:01 local
        await expect(page.getByRole('heading', { name: 'Wednesday, November 4' })).toBeVisible();
        await expect(page.getByText(/no logs recorded/i)).toBeVisible();
        // Nothing logged on Nov 4 yet, so the streak counted back from the new today is 0
        await expect(stat(page, 'Current Streak')).toHaveText('0');
    });

    test('regression: at the end of the month the calendar moves to the new month', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-30T16:59:00.000Z') }); // Nov 30, 23:59 local
        await registerViaUi(page);
        await page.goto('/calendar');
        await expect(page.getByText('November 2026')).toBeVisible();

        await page.clock.fastForward('02:00'); // Dec 1, 00:01 local
        await expect(page.getByText('December 2026')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Tuesday, December 1' })).toBeVisible();
    });

    test('at the end of the year the calendar moves to January of the new year', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-12-31T16:59:00.000Z') }); // Dec 31, 23:59 local
        await registerViaUi(page);
        await page.goto('/calendar');
        await expect(page.getByText('December 2026')).toBeVisible();

        await page.clock.fastForward('02:00'); // Jan 1 2027, 00:01 local
        await expect(page.getByText('January 2027')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Friday, January 1' })).toBeVisible();
    });

    test('regression: a day picked on the last evening of the month stays picked into the next month', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-30T16:59:00.000Z') }); // Nov 30, 23:59 local
        await registerViaUi(page);
        await page.goto('/calendar');
        await page.getByRole('button', { name: '15', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Sunday, November 15' })).toBeVisible();

        await page.clock.fastForward('02:00'); // Dec 1, 00:01 local
        await expect(page.getByText('November 2026')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Sunday, November 15' })).toBeVisible();
    });

    test('a day or month the user picked stays picked across midnight', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-03T16:59:00.000Z') }); // Nov 3, 23:59 local
        await registerViaUi(page);
        await page.goto('/calendar');
        await page.getByRole('button', { name: '1', exact: true }).first().click();
        await expect(page.getByRole('heading', { name: 'Sunday, November 1' })).toBeVisible();

        await page.clock.fastForward('02:00');
        await expect(page.getByRole('heading', { name: 'Sunday, November 1' })).toBeVisible();
    });
});
