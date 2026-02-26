import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, type ApiUser } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
    user: ApiUser | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => void;
    logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'freq_token';
const USER_KEY = 'freq_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem(TOKEN_KEY)
    );
    const [user, setUser] = useState<ApiUser | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? (JSON.parse(stored) as ApiUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    // On mount: check URL hash for Google OAuth token redirect
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#token=')) {
            const t = hash.slice(7);
            // Clear hash from URL silently
            window.history.replaceState(null, '', window.location.pathname);
            // We don't have user details from hash; a quick /auth/me would be ideal,
            // but for now store token and let pages refetch as needed.
            localStorage.setItem(TOKEN_KEY, t);
            setToken(t);
        }
    }, []);

    const persist = useCallback((t: string, u: ApiUser) => {
        localStorage.setItem(TOKEN_KEY, t);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        setToken(t);
        setUser(u);
    }, []);

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

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, login, register, loginWithGoogle, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

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
