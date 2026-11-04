// ─── Types ────────────────────────────────────────────────────────────────────

import type {
    ActionBody, ApiAction, ApiLog, ApiUser, AuthResponse, ChangePasswordBody, CreateLogBody, LoginBody, MeResponse,
    RegisterBody, SuccessResponse, UpdateProfileBody, StatsResponse, StreakResponse, UpdateLogBody,
} from './api-types';

// Pages import these from here
export type { ApiAction, ApiLog, ApiUser };

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

let onUnauthorized: (() => void) | null = null;

/** Called when a request sent with a token gets 401 (expired or revoked session). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
    onUnauthorized = handler;
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('freq_token');
    const url = `${BASE}${path}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(url, { ...options, headers });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const msg = (body as { error?: string }).error ?? res.statusText;
            console.error(`[API] Error from ${url}: ${res.status} - ${msg}`);
            // Login/register answer 401 for a wrong password; a 401 for an older token
            // than the stored one must not end the newer session
            if (res.status === 401 && token && !path.startsWith('/auth/')
                && token === localStorage.getItem('freq_token')) {
                onUnauthorized?.();
            }
            throw new ApiError(res.status, msg);
        }

        return res.json() as Promise<T>;
    } catch (err) {
        console.error(`[API] Fatal error fetching ${url}:`, err);
        throw err;
    }
}

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

/** For `.catch()`: turns a 404 into an ApiError with a message for the user, rethrows anything else */
export function renameNotFound(message: string) {
    return (err: unknown): never => {
        if (err instanceof ApiError && err.status === 404) throw new ApiError(404, message);
        throw err;
    };
}

/** Text to show the user for a failed call: the server's reason for 4xx, a generic line otherwise */
export function errorMessage(err: unknown): string {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) return err.message;
    return 'Something went wrong. Check your connection and try again.';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
    register: (email: string, password: string, name: string) =>
        apiFetch<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name } satisfies RegisterBody),
        }),

    login: (email: string, password: string) =>
        apiFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password } satisfies LoginBody),
        }),

    getMe: () =>
        apiFetch<MeResponse>('/auth/me'),

    updateProfile: (data: UpdateProfileBody) =>
        apiFetch<MeResponse>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

    changePassword: (data: ChangePasswordBody) =>
        apiFetch<SuccessResponse>('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

    /** Redirect browser to Google OAuth — no fetch needed */
    loginWithGoogle: () => {
        const url = `${BASE}/auth/google`;
        console.log(`[AUTH] Redirecting to Google Login: ${url}`);
        window.location.href = url;
    },
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export const actionsApi = {
    list: () => apiFetch<ApiAction[]>('/actions'),

    get: (id: string) => apiFetch<ApiAction>(`/actions/${id}`),

    create: (data: ActionBody) =>
        apiFetch<ApiAction>('/actions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Partial<ActionBody>) =>
        apiFetch<ApiAction>(`/actions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    remove: (id: string) =>
        apiFetch<SuccessResponse>(`/actions/${id}`, { method: 'DELETE' }),
};

// ─── Logs ─────────────────────────────────────────────────────────────────────

/** An instant range [from, to) as ISO strings */
export type DayRange = { from: string; to: string };

/** Bounds of a calendar day in the user's local timezone (month is 0-based) */
export function localDayRange(year: number, month: number, day: number): DayRange {
    return {
        from: new Date(year, month, day).toISOString(),
        to: new Date(year, month, day + 1).toISOString(),
    };
}

/** Bounds of a calendar month in the user's local timezone (month is 0-based) */
export function localMonthRange(year: number, month: number): DayRange {
    return {
        from: new Date(year, month, 1).toISOString(),
        to: new Date(year, month + 1, 1).toISOString(),
    };
}

export const logsApi = {
    list: (params?: Partial<DayRange> & { last24h?: boolean }) => {
        const qs = new URLSearchParams();
        if (params?.from) qs.set('from', params.from);
        if (params?.to) qs.set('to', params.to);
        if (params?.last24h) qs.set('last24h', 'true');
        return apiFetch<ApiLog[]>(`/logs${qs.toString() ? '?' + qs.toString() : ''}`);
    },

    get: (id: string) => apiFetch<ApiLog>(`/logs/${id}`),

    /** `today` is the local day's range, so the count follows the user's timezone */
    stats: (today: DayRange) =>
        apiFetch<StatsResponse>(
            `/logs/stats?${new URLSearchParams(today).toString()}`
        ),

    /** Consecutive local days with a log, counting back from `today` (the caller's local YYYY-MM-DD, from useToday) */
    streak: (actionId: string | null, today: string) => {
        const qs = new URLSearchParams({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, today });
        if (actionId) qs.set('actionId', actionId);
        return apiFetch<StreakResponse>(`/logs/streak?${qs.toString()}`);
    },

    create: (data: CreateLogBody) =>
        apiFetch<ApiLog>('/logs', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: UpdateLogBody) =>
        apiFetch<ApiLog>(`/logs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    remove: (id: string) =>
        apiFetch<SuccessResponse>(`/logs/${id}`, { method: 'DELETE' }),
};
