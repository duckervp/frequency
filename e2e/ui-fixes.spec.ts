import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

async function createAction(page: Page, name: string, icon?: string) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    const res = await page.request.post(`${API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` }, data: { name, icon } });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).id as string;
}

test('regression: a signed-in user opening / or /login lands on the dashboard', async ({ page }) => {
    await registerViaUi(page);
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
    expect(await page.evaluate(() => localStorage.getItem('freq_token'))).toBe(token);
});

test.describe('touch screen', () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test('regression: Manage Actions shows edit and delete without hovering', async ({ page }) => {
        await registerViaUi(page);
        await createAction(page, 'Stretch');
        await page.goto('/manage-actions');
        const edit = page.getByRole('button', { name: 'edit' });
        await expect(edit).toBeVisible();
        const opacity = await edit.evaluate((el) => getComputedStyle(el.parentElement!).opacity);
        expect(opacity).toBe('1');
    });
});

test('regression: a starter action on the dashboard opens New Action with its name, not a Quick Log', async ({ page }) => {
    await registerViaUi(page);
    await page.getByRole('button', { name: /Drink Water/ }).click();
    await expect(page).toHaveURL(/\/create/);
    await expect(page.getByPlaceholder('e.g., Read Book')).toHaveValue('Drink Water');

    // Every starter's icon is offered by New Action, so it arrives selected
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Take Medicine/ }).click();
    await expect(page.getByRole('button', { name: 'pill' })).toHaveClass(/border-primary/);
});

test.describe('Log page across midnight in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('regression: the date pills move to the new day after local midnight', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-03T16:59:00.000Z') }); // Nov 3, 23:59 local
        await registerViaUi(page);
        await page.goto('/log');
        await expect(page.getByRole('heading', { name: 'Today, Nov 3' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nov 1', exact: true })).toBeVisible();

        await page.clock.fastForward('02:00'); // Nov 4, 00:01 local
        await expect(page.getByRole('heading', { name: 'Today, Nov 4' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nov 2', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Oct 28', exact: true })).toHaveCount(0);
    });

    test('a past day picked before midnight stays picked after it', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-03T16:59:00.000Z') }); // Nov 3, 23:59 local
        await registerViaUi(page);
        await page.goto('/log');
        await page.getByRole('button', { name: 'Nov 1', exact: true }).click();

        await page.clock.fastForward('02:00'); // Nov 4, 00:01 local
        await expect(page.getByRole('heading', { name: 'Today, Nov 4' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nov 1', exact: true })).toHaveClass(/bg-primary/);
    });
});

test('deleting an action warns that its logs become Quick Log', async ({ page }) => {
    await registerViaUi(page);
    await createAction(page, 'Stretch');
    await page.goto('/manage-actions');
    let message = '';
    page.once('dialog', (dialog) => { message = dialog.message(); dialog.dismiss(); });
    await page.getByRole('button', { name: 'delete' }).click();
    await expect.poll(() => message).toContain('Stretch');
    expect(message).toContain('Quick Log');
});

test('regression: images are served by the app and the icon font only carries the icons in use', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => { if (req.url().includes('googleusercontent.com')) external.push(req.url()); });
    await page.goto('/login');
    await registerViaUi(page);
    await page.goto('/log');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);

    const fontCss = await page.locator('link[href*="Material+Symbols"]').getAttribute('href');
    expect(fontCss).toContain('icon_names=');
});

test('regression: every icon on every page renders as a glyph, not as its name', async ({ page }) => {
    const failures: string[] = [];
    const check = async (label: string) => {
        await page.waitForLoadState('networkidle');
        const wide = await page.evaluate(async () => {
            await document.fonts.ready;
            return [...document.querySelectorAll('.material-symbols-outlined')]
                .filter((el) => {
                    const box = el.getBoundingClientRect();
                    // A missing glyph falls back to the ligature text, several em wide
                    return box.width > parseFloat(getComputedStyle(el).fontSize) * 1.5;
                })
                .map((el) => el.textContent!.trim());
        });
        for (const name of wide) failures.push(`${label}: ${name}`);
    };

    await page.goto('/login');
    await check('/login');
    await page.getByRole('button', { name: /continue with email/i }).click();
    await check('/login email');
    await registerViaUi(page);
    // Mobile stores icon names with '-' and offers icons the web picker does not; unknown names must not show as text
    const actionId = await createAction(page, 'Walk', 'directions-walk');
    await createAction(page, 'Star', 'star');
    await createAction(page, 'Odd', 'not-an-icon');
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    const log = await (await page.request.post(`${API_URL}/logs`, { headers: { Authorization: `Bearer ${token}` }, data: { actionId, loggedAt: new Date(Date.now() - 60_000).toISOString() } })).json();
    for (const path of ['/dashboard', '/log', '/calendar', '/settings', '/manage-actions', '/create', `/register?actionId=${actionId}`, `/edit?logId=${log.log.id}`, '/edit']) {
        await page.goto(path);
        await check(path);
    }
    await page.goto('/calendar');
    await page.getByRole('button').filter({ has: page.getByText('All Actions', { exact: true }) }).click();
    await check('/calendar filter open');
    expect(failures).toEqual([]);
});
