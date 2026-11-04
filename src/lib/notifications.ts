// Browser notifications for action reminders. They only fire while a tab of the app is open
// (there is no push server). iPhone is not supported yet: iOS only allows notifications for web
// apps installed from a manifest, which the app does not have.

export type NotificationState = 'on' | 'off' | 'blocked' | 'unsupported';

const SW_URL = '/sw.js';
let registration: Promise<ServiceWorkerRegistration> | null = null;

export function notificationState(): NotificationState {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
    if (Notification.permission === 'granted') return 'on';
    if (Notification.permission === 'denied') return 'blocked';
    return 'off';
}

/**
 * The worker that shows reminders. A failed registration rejects here instead of hanging
 * like navigator.serviceWorker.ready would, and the next call tries again.
 */
function worker(): Promise<ServiceWorkerRegistration> {
    registration ??= navigator.serviceWorker.register(SW_URL).catch((err) => {
        registration = null;
        throw err;
    });
    return registration;
}

/** Asks for permission (must run from a click) and registers the worker that shows reminders */
export async function enableNotifications(): Promise<NotificationState> {
    if (notificationState() === 'unsupported') return 'unsupported';
    if ((await Notification.requestPermission()) === 'granted') await worker();
    return notificationState();
}

export async function registerNotificationWorker() {
    if (notificationState() === 'on') await worker();
}

/** A reminder is due from its time until an hour later, so a tab opened a bit late still reminds */
export function isReminderDue(reminderTime: string, now: Date): boolean {
    const [h, m] = reminderTime.split(':').map(Number);
    const minutes = now.getHours() * 60 + now.getMinutes();
    const at = h * 60 + m;
    return minutes >= at && minutes < at + 60;
}

export async function showReminder(title: string, tag: string, url: string) {
    await (await worker()).showNotification(title, { body: 'Tap to log it', tag, data: { url } });
}
