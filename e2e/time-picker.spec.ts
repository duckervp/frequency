import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

async function authHeaders(page: Page) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    return { Authorization: `Bearer ${token}` };
}

async function listActions(page: Page, headers: Record<string, string>) {
    const res = await page.request.get(`${API_URL}/actions`, { headers });
    return (await res.json()) as { id: string; name: string; remindersEnabled: boolean; reminderTime: string | null }[];
}

const hour = (page: Page) => page.getByRole('spinbutton', { name: 'Hour' });
const minute = (page: Page) => page.getByRole('spinbutton', { name: 'Minute' });
const periodButton = (page: Page, p: 'AM' | 'PM') => page.getByRole('button', { name: p, exact: true });

async function typeInto(page: Page, field: ReturnType<typeof hour>, text: string) {
    await field.click();
    await page.keyboard.type(text);
}

async function newActionWithReminder(page: Page, name: string) {
    await page.goto('/create');
    await page.getByPlaceholder('e.g., Read Book').fill(name);
    await page.getByRole('switch', { name: 'Daily Notification' }).click();
}

test('reminder picker shows only when reminders are on', async ({ page }) => {
    await registerViaUi(page);
    const headers = await authHeaders(page);
    await page.goto('/create');
    await page.getByPlaceholder('e.g., Read Book').fill('Stretch');
    await expect(hour(page)).toHaveCount(0);

    const toggle = page.getByRole('switch', { name: 'Daily Notification' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(hour(page)).toHaveValue('08');
    await expect(minute(page)).toHaveValue('00');
    await expect(periodButton(page, 'AM')).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(hour(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Create Action' }).click();
    await expect(page).not.toHaveURL(/\/create/);

    const [action] = await listActions(page, headers);
    expect(action).toMatchObject({ name: 'Stretch', remindersEnabled: false, reminderTime: '08:00' });
});

test('typed reminder time is saved, shown on edit, and midnight maps to 00', async ({ page }) => {
    await registerViaUi(page);
    const headers = await authHeaders(page);
    await newActionWithReminder(page, 'Journal');

    await typeInto(page, hour(page), '8');
    await typeInto(page, minute(page), '45');
    await periodButton(page, 'PM').click();
    await page.getByRole('button', { name: 'Create Action' }).click();
    await expect(page).not.toHaveURL(/\/create/);

    const [action] = await listActions(page, headers);
    expect(action).toMatchObject({ remindersEnabled: true, reminderTime: '20:45' });

    await page.goto(`/create?edit=${action.id}`);
    await expect(hour(page)).toHaveValue('08');
    await expect(minute(page)).toHaveValue('45');
    await expect(periodButton(page, 'PM')).toHaveAttribute('aria-pressed', 'true');

    await typeInto(page, hour(page), '12');
    await typeInto(page, minute(page), '05');
    await periodButton(page, 'AM').click();
    await page.getByRole('button', { name: 'Update Action' }).click();
    await expect(page).not.toHaveURL(/\/create/);
    await expect.poll(async () => (await listActions(page, headers))[0].reminderTime).toBe('00:05');
});

test('invalid typed values are never saved and revert on blur', async ({ page }) => {
    await registerViaUi(page);
    await newActionWithReminder(page, 'Walk');

    await typeInto(page, hour(page), '0');
    await expect(hour(page)).toHaveValue('0');
    await page.keyboard.press('Tab');
    await expect(hour(page)).toHaveValue('08');

    // "1" is a valid hour on its own, so "13" keeps 1
    await typeInto(page, hour(page), '13');
    await page.keyboard.press('Tab');
    await expect(hour(page)).toHaveValue('01');

    await typeInto(page, minute(page), 'ab');
    await expect(minute(page)).toHaveValue('00');
    // Still focused with the caret after "00": the next digit starts a new number
    await typeInto(page, minute(page), '75');
    await page.keyboard.press('Enter');
    await expect(minute(page)).toHaveValue('07');

    await minute(page).click();
    await page.keyboard.press('Backspace');
    await expect(minute(page)).toHaveValue('');
    await page.keyboard.press('Tab');
    await expect(minute(page)).toHaveValue('07');
});

test('a click steps once, holding repeats, and keyboard arrows wrap', async ({ page }) => {
    await registerViaUi(page);
    await newActionWithReminder(page, 'Water');

    const increaseMinute = page.getByRole('button', { name: 'Increase minute' });
    await increaseMinute.click();
    await expect(minute(page)).toHaveValue('01');

    await increaseMinute.hover();
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    const held = Number(await minute(page).inputValue());
    expect(held).toBeGreaterThanOrEqual(5);
    await page.waitForTimeout(300);
    await expect(minute(page)).toHaveValue(String(held).padStart(2, '0')); // stopped on release

    await minute(page).fill('00');
    await minute(page).press('ArrowDown');
    await expect(minute(page)).toHaveValue('59');
    await minute(page).press('ArrowUp');
    await expect(minute(page)).toHaveValue('00');

    await hour(page).focus();
    for (let i = 0; i < 4; i++) await hour(page).press('ArrowUp');
    await expect(hour(page)).toHaveValue('12');
    await hour(page).press('ArrowUp');
    await expect(hour(page)).toHaveValue('01');
});

test.describe('touch', () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });

    test('a tap steps once, and a scroll that starts on an arrow changes nothing', async ({ page }) => {
        await registerViaUi(page);
        await newActionWithReminder(page, 'Water');

        const increaseMinute = page.getByRole('button', { name: 'Increase minute' });
        await increaseMinute.tap();
        await expect(minute(page)).toHaveValue('01');

        // The browser cancels the pointer once it decides the touch is a scroll; no click follows
        await increaseMinute.evaluate((el) => {
            const init = { bubbles: true, pointerType: 'touch', pointerId: 7, button: 0, isPrimary: true };
            el.dispatchEvent(new PointerEvent('pointerdown', init));
            el.dispatchEvent(new PointerEvent('pointercancel', init));
        });
        await page.waitForTimeout(600);
        await expect(minute(page)).toHaveValue('01');
    });
});

test.describe('register in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('a typed time is logged at that time today', async ({ page }) => {
        await registerViaUi(page);
        const headers = await authHeaders(page);
        await page.clock.setFixedTime(new Date('2026-11-03T05:00:00.000Z')); // Nov 3, 12:00 PM local
        await page.goto('/register');
        await expect(hour(page)).toHaveValue('12');
        await expect(periodButton(page, 'PM')).toHaveAttribute('aria-pressed', 'true');

        await typeInto(page, hour(page), '9');
        await typeInto(page, minute(page), '30');
        await periodButton(page, 'AM').click();
        await page.getByRole('button', { name: /Save Action/ }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        const res = await page.request.get(`${API_URL}/logs`, { headers });
        const [row] = await res.json();
        expect(row.log.loggedAt).toBe('2026-11-03T02:30:00.000Z'); // Nov 3, 09:30 local
    });
});
