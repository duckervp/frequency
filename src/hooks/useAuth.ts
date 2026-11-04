import { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiUser } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
    user: ApiUser | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => void;
    logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

/** Guard: redirect to /login if no token */
export function useRequireAuth() {
    const { token } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!token) navigate('/login', { replace: true });
    }, [token, navigate]);
}
