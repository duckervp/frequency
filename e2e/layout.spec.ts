import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';
const COLUMN = 448; // max-w-md

/**
 * Every control and heading in a top bar (<header> or sticky top-0) or a fixed element (bottom nav,
 * floating buttons, footers) must sit inside the centered max-w-md column.
 */
async function headerOutsideColumn(page: Page) {
    return page.evaluate((column) => {
        // clientWidth excludes the scrollbar, which shifts the centered column in headed runs
        const left = (document.documentElement.clientWidth - column) / 2;
        const right = left + column;
        return [...document.querySelectorAll(':is(header, .sticky.top-0, .fixed) :is(button, a, h1, h2)')]
            .map((el) => ({ el, box: el.getBoundingClientRect() }))
            .filter(({ el }) => getComputedStyle(el).visibility !== 'hidden')
            .filter(({ box }) => box.width > 0 && (box.left < left - 1 || box.right > right + 1))
            .map(({ el, box }) => `${el.tagName.toLowerCase()} "${el.textContent?.trim()}" at x=${Math.round(box.left)}-${Math.round(box.right)}`);
    }, COLUMN);
}

test.describe('desktop layout', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('regression: top bars and fixed controls stay in the centered column on every page', async ({ page }) => {
        await registerViaUi(page);
        const token = await page.evaluate(() => localStorage.getItem('freq_token'));
        const res = await page.request.post(`${API_URL}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { loggedAt: new Date().toISOString() },
        });
        const logId = (await res.json()).log.id;

        const pages = ['/dashboard', '/log', '/calendar', '/settings', '/manage-actions', '/create', '/register', `/edit?logId=${logId}`];
        const failures: string[] = [];
        for (const path of pages) {
            await page.goto(path);
            await expect(page.locator('header, .sticky.top-0').first()).toBeVisible();
            await page.waitForLoadState('networkidle');
            for (const f of await headerOutsideColumn(page)) failures.push(`${path}: ${f}`);
        }
        expect(failures).toEqual([]);
    });
});
