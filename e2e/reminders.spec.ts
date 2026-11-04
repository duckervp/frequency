import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

const API_URL = 'http://localhost:3101/api';

/**
 * Headless Chromium cannot show real notifications, so the Notification and service worker
 * APIs are replaced by fakes that record what the app shows. `permission` is the start state.
 */
async function fakeNotifications(context: BrowserContext, permission: NotificationPermission) {
    await context.addInitScript((initial) => {
        let current = (localStorage.getItem('__permission') as NotificationPermission | null) ?? initial;
        const registration = {
            showNotification: async (title: string, options: NotificationOptions & { data?: { url?: string } } = {}) => {
                // Re-read on every call: all tabs share this list, so a duplicate from another tab is counted
                const shown = JSON.parse(localStorage.getItem('__shown') ?? '[]');
                shown.push({ title, tag: options.tag, url: options.data?.url });
                localStorage.setItem('__shown', JSON.stringify(shown));
            },
        };
        class FakeNotification {
            static get permission() { return current; }
            static async requestPermission() {
                current = 'granted';
                localStorage.setItem('__permission', current);
                return current;
            }
        }
        Object.defineProperty(window, 'Notification', { value: FakeNotification, configurable: true });
        Object.defineProperty(navigator, 'serviceWorker', {
            value: { register: async () => registration, ready: Promise.resolve(registration) },
            configurable: true,
        });
    }, permission);
}

async function shownNotifications(page: Page) {
    return page.evaluate(() => JSON.parse(localStorage.getItem('__shown') ?? '[]') as { title: string; tag?: string; url?: string }[]);
}

async function createReminder(page: Page, name: string, reminderTime: string) {
    const token = await page.evaluate(() => localStorage.getItem('freq_token'));
    const res = await page.request.post(`${API_URL}/actions`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { name, remindersEnabled: true, reminderTime },
    });
    return (await res.json()).id as string;
}

test.describe('reminders in UTC+7', () => {
    test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

    test('notifies once at the reminder time, and a click opens Register for that action', async ({ page, context }) => {
        await fakeNotifications(context, 'granted');
        await context.clock.install({ time: new Date('2026-11-04T00:58:00.000Z') }); // Nov 4, 07:58 local
        await registerViaUi(page);
        const id = await createReminder(page, 'Read', '08:00');
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        await context.clock.fastForward('01:00'); // 07:59: not yet
        expect(await shownNotifications(page)).toEqual([]);

        await context.clock.fastForward('02:00'); // 08:01
        await expect.poll(() => shownNotifications(page)).toEqual([
            { title: 'Time for Read', tag: `reminder:${id}:2026-11-04`, url: `/register?actionId=${id}` },
        ]);

        await context.clock.fastForward('10:00'); // still today: no second notification
        expect(await shownNotifications(page)).toHaveLength(1);
    });

    test('does not remind about an action already logged today', async ({ page, context }) => {
        await fakeNotifications(context, 'granted');
        await context.clock.install({ time: new Date('2026-11-04T00:58:00.000Z') }); // 07:58 local
        await registerViaUi(page);
        const id = await createReminder(page, 'Read', '08:00');
        const token = await page.evaluate(() => localStorage.getItem('freq_token'));
        await page.request.post(`${API_URL}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { actionId: id, loggedAt: '2026-11-04T00:30:00.000Z' }, // 07:30 local
        });
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        await context.clock.fastForward('03:00');
        await page.waitForTimeout(500);
        expect(await shownNotifications(page)).toEqual([]);
    });

    test('two open tabs show the reminder only once', async ({ page, context }) => {
        await fakeNotifications(context, 'granted');
        await context.clock.install({ time: new Date('2026-11-04T00:58:00.000Z') }); // 07:58 local
        await registerViaUi(page);
        await createReminder(page, 'Read', '08:00');
        await page.goto('/dashboard');
        const second = await context.newPage();
        await second.goto('/log');
        await Promise.all([page.waitForLoadState('networkidle'), second.waitForLoadState('networkidle')]);

        await context.clock.fastForward('03:00');
        await expect.poll(() => shownNotifications(page)).toHaveLength(1);
        await page.waitForTimeout(500);
        expect(await shownNotifications(second)).toHaveLength(1);
    });

    test('nothing is shown until the user turns notifications on in Settings', async ({ page, context }) => {
        await fakeNotifications(context, 'default');
        await context.clock.install({ time: new Date('2026-11-04T00:58:00.000Z') }); // 07:58 local
        await registerViaUi(page);
        await createReminder(page, 'Read', '08:00');
        await page.goto('/settings');
        await expect(page.getByText('Notifications', { exact: true }).locator('xpath=..')).toContainText('Off');

        await context.clock.fastForward('03:00');
        await page.waitForTimeout(500);
        expect(await shownNotifications(page)).toEqual([]);

        await page.getByText('Notifications', { exact: true }).click();
        await expect(page.getByText('Notifications', { exact: true }).locator('xpath=..')).toContainText('On');
        await context.clock.fastForward('00:40');
        await expect.poll(() => shownNotifications(page)).toHaveLength(1);
    });
    test('an action with reminders off is never reminded, and a tab opened after the hour is up stays quiet', async ({ page, context }) => {
        await fakeNotifications(context, 'granted');
        await context.clock.install({ time: new Date('2026-11-04T01:59:00.000Z') }); // Nov 4, 08:59 local
        await registerViaUi(page);
        const token = await page.evaluate(() => localStorage.getItem('freq_token'));
        await page.request.post(`${API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` }, data: { name: 'Off', remindersEnabled: false, reminderTime: '08:59' } });
        await createReminder(page, 'Late', '08:00'); // 08:59 is still inside its hour
        await createReminder(page, 'Missed', '07:30'); // its hour ended at 08:30
        await page.goto('/dashboard');

        await expect.poll(() => shownNotifications(page)).toHaveLength(1);
        expect((await shownNotifications(page))[0].title).toBe('Time for Late');
    });
});
