// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
}

export interface ApiAction {
    id: string;
    userId: string;
    name: string;
    icon: string;
    color: string;
    remindersEnabled: boolean;
    reminderTime: string | null;
    createdAt: string;
}

export interface ApiLog {
    log: {
        id: string;
        userId: string;
        actionId: string | null;
        loggedAt: string;
        note: string | null;
        createdAt: string;
    };
    action: ApiAction | null;
}

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
    register: (email: string, password: string, name: string) =>
        apiFetch<{ token: string; user: ApiUser }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        }),

    login: (email: string, password: string) =>
        apiFetch<{ token: string; user: ApiUser }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    getMe: () =>
        apiFetch<{ user: ApiUser }>('/auth/me'),

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

    create: (data: {
        name: string;
        icon?: string;
        color?: string;
        remindersEnabled?: boolean;
        reminderTime?: string;
    }) =>
        apiFetch<ApiAction>('/actions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (
        id: string,
        data: Partial<{
            name: string;
            icon: string;
            color: string;
            remindersEnabled: boolean;
            reminderTime: string;
        }>
    ) =>
        apiFetch<ApiAction>(`/actions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    remove: (id: string) =>
        apiFetch<{ success: boolean }>(`/actions/${id}`, { method: 'DELETE' }),
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
        apiFetch<{ totalToday: number; dateInfo: string }>(
            `/logs/stats?${new URLSearchParams(today).toString()}`
        ),

    create: (data: { actionId?: string; loggedAt: string; note?: string }) =>
        apiFetch<ApiLog>('/logs', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: { loggedAt?: string; note?: string }) =>
        apiFetch<ApiLog>(`/logs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    remove: (id: string) =>
        apiFetch<{ success: boolean }>(`/logs/${id}`, { method: 'DELETE' }),
};
