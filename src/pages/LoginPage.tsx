import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

type Mode = 'choose' | 'email-login' | 'email-register';

export const LoginPage: React.FC = () => {
    const { login, register, loginWithGoogle, isLoading } = useAuth();
    const [mode, setMode] = useState<Mode>('choose');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (mode === 'email-login') {
                await login(email, password);
            } else {
                await register(email, password, name);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="relative flex h-full min-h-screen w-full max-w-md flex-col bg-background-light dark:bg-background-dark overflow-hidden shadow-2xl">

                <div className="flex-1 flex flex-col items-center justify-center px-8 w-full">
                    {/* Hero */}
                    <div className="w-full mb-8 mt-12">
                        <div
                            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-xl min-h-[220px] bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent shadow-lg border border-primary/10"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAhN19zQzIeEljR3KQqs_2IdyqEjEGHDABRZ1OnP_KXnSzOEqEYW_xL9BR8axdOd3PDgxd9jAwg8gxQjEW2gUIca-j1OD9qfhAQUF60helCTR02lZ-XjogcJDj7xDUA3tYwQzLqEAU3JDXFyiG-YgG_RotKLu65jzi7yWjp6XwD4a-vbxGHdGLvmjak7HZvpK4OJFXGr9qOH3fArUvaEDksc24yc1BRNDKWJWb7EK6oydKA3F3FFPK3FvS2rRjNegenlA5GKFWSq_Y")' }}
                        />
                    </div>

                    {/* Logo & Brand */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                            <span className="material-symbols-outlined text-primary text-4xl leading-none">analytics</span>
                        </div>
                        <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-4xl font-bold leading-tight mb-3">Frequency</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed">
                            Your private space for personal habits and action tracking.
                        </p>
                    </div>

                    {/* Choose mode or Email form */}
                    {mode === 'choose' ? (
                        <div className="w-full space-y-4">
                            {/* Google */}
                            <button
                                onClick={loginWithGoogle}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 gap-3 text-base font-bold transition-all active:scale-95 shadow-lg hover:opacity-90"
                            >
                                <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M224,128a96,96,0,1,1-21.95-61.09,8,8,0,1,1-12.33,10.18A80,80,0,1,0,207.6,136H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128Z" />
                                </svg>
                                <span className="truncate">Continue with Google</span>
                            </button>

                            {/* Email */}
                            <button
                                onClick={() => setMode('email-login')}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-slate-900 gap-3 text-base font-bold transition-all active:scale-95 shadow-md hover:bg-primary/90"
                            >
                                <span className="material-symbols-outlined text-lg">mail</span>
                                <span className="truncate">Continue with Email</span>
                            </button>

                            <div className="flex py-2 justify-center">
                                <button
                                    onClick={() => setMode('email-register')}
                                    className="text-slate-500 dark:text-slate-400 text-sm font-semibold hover:text-primary transition-colors"
                                >
                                    Create new account
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
                            <h2 className="text-lg font-bold text-center mb-2">
                                {mode === 'email-login' ? 'Sign In' : 'Create Account'}
                            </h2>

                            {mode === 'email-register' && (
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                />
                            )}

                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />

                            {error && (
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full cursor-pointer items-center justify-center rounded-xl h-14 px-5 bg-primary text-slate-900 text-base font-bold transition-all active:scale-95 shadow-md hover:bg-primary/90 disabled:opacity-60"
                            >
                                {isLoading ? 'Please wait...' : mode === 'email-login' ? 'Sign In' : 'Create Account'}
                            </button>

                            <div className="flex py-1 justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(mode === 'email-login' ? 'email-register' : 'email-login');
                                        setError('');
                                    }}
                                    className="text-slate-500 dark:text-slate-400 text-sm font-semibold hover:text-primary transition-colors"
                                >
                                    {mode === 'email-login' ? "Don't have an account? Create one" : "Already have an account? Sign In"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setMode('choose'); setError(''); }}
                                className="w-full text-slate-500 text-xs font-medium hover:text-primary transition-colors opacity-70"
                            >
                                ← Back to options
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 pb-10 text-center mt-auto pt-8">
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                        By continuing, you agree to Frequency's <br />
                        <span className="underline cursor-pointer hover:text-primary transition-colors">Terms of Service</span> and{' '}
                        <span className="underline cursor-pointer hover:text-primary transition-colors">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
