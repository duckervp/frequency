import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Returns to the screen that opened this one, so a page reached from several places
 * (dashboard, Manage Actions, ...) goes back where the user came from. When the page
 * was opened directly (new tab, reload of a shared link) there is no in-app entry to
 * go back to, so it replaces itself with `fallback` instead of leaving the app.
 */
export function useGoBack(fallback: string): () => void {
    const navigate = useNavigate();
    const { key } = useLocation();
    return useCallback(() => {
        // React Router keeps `idx` (0 for the tab's first entry, kept by replace) and `key` in history.state
        const state = window.history.state as { idx?: number; key?: string } | null;
        // A save that finishes after the user already left (e.g. Done then Close) must not go back again
        if ((state?.key ?? 'default') !== key) return;
        if ((state?.idx ?? 0) > 0) navigate(-1);
        else navigate(fallback, { replace: true });
    }, [key, navigate, fallback]);
}
