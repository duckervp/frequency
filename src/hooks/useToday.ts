import { useEffect, useState } from 'react';
import { localDateKey } from '../lib/time';

/**
 * Today's local date (YYYY-MM-DD). Changes at local midnight, and when the tab becomes visible
 * again (timers can be late after the device slept), so pages left open do not keep yesterday.
 */
export function useToday(): string {
    const [today, setToday] = useState(() => localDateKey());
    // Bumped by every check, so the timer is armed again even when the date did not change yet
    const [checks, setChecks] = useState(0);

    useEffect(() => {
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timer = setTimeout(() => {
            setToday(localDateKey());
            setChecks((c) => c + 1);
        }, nextMidnight.getTime() - now.getTime() + 1000);
        const onVisible = () => setToday(localDateKey());
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [today, checks]);

    return today;
}
