// Local-time helpers for log timestamps. All "day" logic uses the user's local timezone;
// values sent to the API are ISO instants (UTC, with Z).

/** Local "HH:mm" (24h) of `d`, the value TimePicker edits */
export function timeOfDay(d = new Date()): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function setLocalTime(d: Date, time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    d.setHours(hours, minutes, 0, 0);
}

/**
 * Instant for a time picked on the Register page ("when did you do it?").
 * Uses today's local date; if that would be in the future (e.g. 11:30 PM picked at 00:15),
 * the user means the previous day.
 * DST note: a picked time that does not exist on a spring-forward day shifts by an hour (not an issue in UTC+7).
 */
export function pickedTimeToISO(time: string, now = new Date()): string {
    const d = new Date(now);
    setLocalTime(d, time);
    if (d > now) d.setDate(d.getDate() - 1);
    return d.toISOString();
}

/** Same local day as `iso`, at the picked time (Edit page keeps the log's date). */
export function withLocalTime(iso: string, time: string): Date {
    const d = new Date(iso);
    setLocalTime(d, time);
    return d;
}

function sameLocalDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** YYYY-MM-DD of `d` in the user's local timezone (toISOString() would give the UTC day) */
export function localDateKey(d = new Date()): string {
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

/** Year, 0-based month and day of a YYYY-MM-DD key */
export function parseDateKey(key: string): { year: number; month: number; day: number } {
    const [year, month, day] = key.split('-').map(Number);
    return { year, month: month - 1, day };
}

/** YYYY-MM-DD of a calendar date (month is 0-based) */
export function dateKey(year: number, month: number, day: number): string {
    return localDateKey(new Date(year, month, day));
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
