import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth, useRequireAuth } from '../hooks/useAuth';

interface SettingsRowProps {
    icon: string;
    label: string;
    badge?: string;
    onClick?: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, label, badge, onClick }) => (
    <div
        onClick={onClick}
        className="flex items-center gap-4 bg-white dark:bg-primary/5 px-4 py-3 rounded-lg border-b border-slate-100 dark:border-primary/5 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors cursor-pointer"
    >
        <div className="flex items-center justify-center rounded-lg bg-slate-100 dark:bg-primary/20 text-slate-700 dark:text-primary shrink-0 size-10">
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <p className="text-base font-medium flex-1">{label}</p>
        <div className="flex items-center gap-2">
            {badge && <span className="text-xs text-primary font-medium">{badge}</span>}
            <span className="material-symbols-outlined text-slate-400 dark:text-primary/30">chevron_right</span>
        </div>
    </div>
);

export const SettingsPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col">
            <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col overflow-x-hidden">

                {/* Header */}
                <header className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-slate-200 dark:border-primary/10">
                    <div
                        onClick={() => navigate(-1)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </div>
                    <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Settings</h1>
                </header>

                <main className="flex-1 pb-32">

                    {/* Profile Section */}
                    <div className="flex p-6">
                        <div className="flex w-full flex-col gap-6 bg-slate-100 dark:bg-primary/5 p-6 rounded-xl border border-slate-200 dark:border-primary/10">
                            <div className="flex items-center gap-5">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-20 w-20 border-2 border-primary shrink-0 bg-primary/10 flex items-center justify-center overflow-hidden"
                                    style={user?.avatarUrl ? { backgroundImage: `url("${user.avatarUrl}")` } : {}}
                                >
                                    {!user?.avatarUrl && (
                                        <span className="material-symbols-outlined text-primary text-3xl">person</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xl font-bold leading-tight">{user?.name ?? 'You'}</p>
                                    <p className="text-slate-500 dark:text-primary/60 text-sm">{user?.email ?? ''}</p>
                                    <p className="text-slate-400 dark:text-primary/40 text-xs mt-1">Frequency member</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <section className="mt-2">
                        <h3 className="text-slate-500 dark:text-primary/60 text-xs font-bold uppercase tracking-widest px-6 pb-2">Account</h3>
                        <div className="flex flex-col px-4">
                            <SettingsRow icon="person" label="Personal Information" />
                            <SettingsRow icon="notifications" label="Notifications" />
                            <SettingsRow
                                icon="tune"
                                label="Manage My Actions"
                                onClick={() => navigate('/manage-actions')}
                            />
                        </div>
                    </section>

                    {/* Privacy & Security */}
                    <section className="mt-8">
                        <h3 className="text-slate-500 dark:text-primary/60 text-xs font-bold uppercase tracking-widest px-6 pb-2">Privacy &amp; Security</h3>
                        <div className="flex flex-col px-4">
                            <SettingsRow icon="lock" label="App Passcode" badge="Enabled" />
                            <SettingsRow icon="security" label="Data Privacy" />
                        </div>
                    </section>

                    {/* Support & About */}
                    <section className="mt-8">
                        <h3 className="text-slate-500 dark:text-primary/60 text-xs font-bold uppercase tracking-widest px-6 pb-2">Support</h3>
                        <div className="flex flex-col px-4">
                            <SettingsRow icon="help" label="Help Center" />
                            <SettingsRow icon="info" label="Version 2.4.0" />
                        </div>
                    </section>

                    {/* Log Out */}
                    <div className="px-4 mt-12 pb-10">
                        <button
                            onClick={logout}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 px-6 rounded-xl transition-colors border border-red-500/20"
                        >
                            Log Out
                        </button>
                    </div>

                </main>

                <BottomNav activeTab="settings" />
            </div>
        </div>
    );
};

export default SettingsPage;
