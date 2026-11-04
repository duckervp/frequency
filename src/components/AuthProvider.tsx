import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, setUnauthorizedHandler, type ApiUser } from '../lib/api';
import { AuthContext } from '../hooks/useAuth';

const TOKEN_KEY = 'freq_token';
const USER_KEY = 'freq_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    // Google OAuth lands on /dashboard#token=... Store it before the page's own effects
    // fetch, otherwise they go out with whatever older token is still stored.
    const [token, setToken] = useState<string | null>(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#token=')) {
            localStorage.setItem(TOKEN_KEY, hash.slice(7));
            localStorage.removeItem(USER_KEY);
            window.history.replaceState(null, '', window.location.pathname);
        }
        return localStorage.getItem(TOKEN_KEY);
    });
    const [user, setUser] = useState<ApiUser | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? (JSON.parse(stored) as ApiUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    const persist = useCallback((t: string, u: ApiUser) => {
        localStorage.setItem(TOKEN_KEY, t);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        setToken(t);
        setUser(u);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        navigate('/login', { replace: true });
    }, [navigate]);

    useEffect(() => {
        setUnauthorizedHandler(logout);
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    const login = useCallback(
        async (email: string, password: string) => {
            setIsLoading(true);
            try {
                const data = await authApi.login(email, password);
                persist(data.token, data.user);
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        },
        [navigate, persist]
    );

    const register = useCallback(
        async (email: string, password: string, name: string) => {
            setIsLoading(true);
            try {
                const data = await authApi.register(email, password, name);
                persist(data.token, data.user);
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        },
        [navigate, persist]
    );

    const loginWithGoogle = useCallback(() => {
        authApi.loginWithGoogle();
    }, []);

    // If we have a token but no user (e.g. after Google OAuth), fetch user details
    useEffect(() => {
        if (token && !user) {
            setIsLoading(true);
            authApi.getMe()
                .then(data => {
                    setUser(data.user);
                    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                })
                .catch(err => {
                    console.error('[AUTH] Failed to fetch user profile:', err);
                    logout();
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [token, user, logout]);

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, login, register, loginWithGoogle, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
