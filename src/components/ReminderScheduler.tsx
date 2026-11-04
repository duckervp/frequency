import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { actionsApi, localDayRange, logsApi, type ApiAction } from '../lib/api';
import { isReminderDue, notificationState, registerNotificationWorker, showReminder } from '../lib/notifications';
import { localDateKey } from '../lib/time';

const TICK_MS = 30_000;
const ACTIONS_MAX_AGE_MS = 5 * 60_000;
const REMINDED_KEY = 'freq_reminded:';

/**
 * Checks every 30 s (a tick survives sleep and background throttling better than one long timer)
 * for actions whose reminder is due today and not logged yet, and shows one notification per
 * action per day, even with several tabs open. Renders nothing.
 */
export function ReminderScheduler() {
    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;
        let active = true;
        let actions: ApiAction[] = [];
        let loadedAt = 0;
        let running = false;

        const tick = async () => {
            if (running || notificationState() !== 'on') return;
            running = true;
            try {
                const now = new Date();
                // A hidden tab keeps its list: it is refreshed when the tab is shown again
                if (now.getTime() - loadedAt > ACTIONS_MAX_AGE_MS && (!document.hidden || loadedAt === 0)) {
                    actions = await actionsApi.list();
                    loadedAt = now.getTime();
                }
                const today = localDateKey(now);
                const due = actions.filter((a) =>
                    a.remindersEnabled && a.reminderTime && isReminderDue(a.reminderTime, now) && !localStorage.getItem(flagFor(a.id, today)));
                if (due.length === 0) return;

                const logs = await logsApi.list(localDayRange(now.getFullYear(), now.getMonth(), now.getDate()));
                const logged = new Set(logs.map((entry) => entry.log.actionId));
                for (const action of due) {
                    if (!active) return; // signed out meanwhile
                    await remindOnce(action, today, logged.has(action.id));
                }
            } catch {
                // Offline, signed out or no service worker: try again on the next tick
            } finally {
                running = false;
            }
        };

        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            loadedAt = 0; // actions may have been edited elsewhere
            tick();
        };

        registerNotificationWorker().catch(() => {});
        tick();
        const timer = setInterval(tick, TICK_MS);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            active = false;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [token]);

    return null;
}

function flagFor(actionId: string, day: string) {
    return `${REMINDED_KEY}${actionId}:${day}`;
}

/** One notification per action per day across tabs: the lock serializes tabs, the stored flag remembers */
async function remindOnce(action: ApiAction, today: string, alreadyLogged: boolean) {
    const flag = flagFor(action.id, today);
    const run = async () => {
        if (localStorage.getItem(flag)) return;
        // Set only after showing, so a failed attempt is retried on the next tick
        if (!alreadyLogged) {
            await showReminder(`Time for ${action.name}`, `reminder:${action.id}:${today}`, `/register?actionId=${action.id}`);
        }
        forgetOtherDays(today);
        localStorage.setItem(flag, '1');
    };
    if ('locks' in navigator) await navigator.locks.request(`freq-reminder:${action.id}`, run);
    else await run();
}

function forgetOtherDays(today: string) {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith(REMINDED_KEY) && !key.endsWith(`:${today}`)) localStorage.removeItem(key);
    }
}

export default ReminderScheduler;
