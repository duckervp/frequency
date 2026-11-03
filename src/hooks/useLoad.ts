import { useCallback, useEffect, useMemo, useState } from 'react';
import { errorMessage } from '../lib/api';

interface LoadState<T> {
    data: T | undefined;
    error: string;
    /** The request this result belongs to; while it differs from the current one, we are loading */
    request: { load: () => Promise<T>; attempt: number } | undefined;
}

/**
 * Loads data for a page: loading and error state, a retry, and responses that arrive after
 * `load` changed (e.g. the user picked another day) are ignored.
 * `load` must be stable: a module function or a useCallback.
 */
export function useLoad<T>(load: () => Promise<T>) {
    const [state, setState] = useState<LoadState<T>>({ data: undefined, error: '', request: undefined });
    const [attempt, setAttempt] = useState(0);
    // A new object for every load/retry, so a result can be matched to the request that produced it
    const request = useMemo(() => ({ load, attempt }), [load, attempt]);

    useEffect(() => {
        let cancelled = false;
        request.load().then(
            (data) => { if (!cancelled) setState({ data, error: '', request }); },
            (err) => {
                if (cancelled) return;
                setState((s) => ({ data: s.request?.load === request.load ? s.data : undefined, error: errorMessage(err), request }));
            },
        );
        return () => { cancelled = true; };
    }, [request]);

    const loading = state.request !== request;
    // Data from another `load` (e.g. the previous day or filter) is never returned; a retry of the same load keeps it
    const data = state.request?.load === load ? state.data : undefined;
    const reload = useCallback(() => setAttempt((a) => a + 1), []);
    /** Update the loaded data locally after a mutation, without refetching */
    const setData = useCallback((update: (data: T) => T) => {
        setState((s) => (s.data === undefined ? s : { ...s, data: update(s.data) }));
    }, []);

    return { data, error: loading ? '' : state.error, loading, reload, setData };
}

/** Runs a mutation (delete, save) and keeps its error message for the page to show */
export function useAsyncAction() {
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const run = useCallback(async (action: () => Promise<void>) => {
        setError('');
        setBusy(true);
        try {
            await action();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    }, []);

    return { run, error, busy };
}
