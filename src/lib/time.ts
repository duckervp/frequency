// Local-time helpers for log timestamps. All "day" logic uses the user's local timezone;
// values sent to the API are ISO instants (UTC, with Z).

export type Period = 'AM' | 'PM';

function to24h(hour: number, period: Period): number {
    return (hour % 12) + (period === 'PM' ? 12 : 0);
}

/**
 * Instant for a time picked on the Register page ("when did you do it?").
 * Uses today's local date; if that would be in the future (e.g. 11:30 PM picked at 00:15),
 * the user means the previous day.
 * DST note: a picked time that does not exist on a spring-forward day shifts by an hour (not an issue in UTC+7).
 */
export function pickedTimeToISO(hour: number, minute: number, period: Period, now = new Date()): string {
    const d = new Date(now);
    d.setHours(to24h(hour, period), minute, 0, 0);
    if (d > now) d.setDate(d.getDate() - 1);
    return d.toISOString();
}

/** Same local day as `iso`, at the picked time (Edit page keeps the log's date). */
export function withLocalTime(iso: string, hour: number, minute: number, period: Period): Date {
    const d = new Date(iso);
    d.setHours(to24h(hour, period), minute, 0, 0);
    return d;
}

function sameLocalDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today, Nov 3" · "Yesterday, Nov 2" · "Oct 1" · "Dec 31, 2025" (other years) */
export function formatLogDay(iso: string, now = new Date()): string {
    const d = new Date(iso);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (sameLocalDay(d, now)) return `Today, ${monthDay}`;
    if (sameLocalDay(d, yesterday)) return `Yesterday, ${monthDay}`;
    if (d.getFullYear() !== now.getFullYear()) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return monthDay;
}
