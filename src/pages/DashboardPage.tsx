import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ErrorState from '../components/ErrorState';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';
import { actionsApi, logsApi } from '../lib/api';
import { useAuth, useRequireAuth } from '../hooks/useAuth';
import { useLoad } from '../hooks/useLoad';
import ActionIcon from '../components/ActionIcon';

const loadLast24h = () => logsApi.list({ last24h: true });

// Default quick action stubs shown when user has no custom actions yet
const DEFAULT_ACTIONS = [
    { id: '__default_medicine', name: 'Take Medicine', icon: 'pill', color: 'bg-blue-500' },
    { id: '__default_water', name: 'Drink Water', icon: 'water_drop', color: 'bg-cyan-500' },
    { id: '__default_exercise', name: 'Exercise', icon: 'fitness_center', color: 'bg-orange-500' },
    { id: '__default_read', name: 'Read', icon: 'menu_book', color: 'bg-purple-500' },
    { id: '__default_meditate', name: 'Meditate', icon: 'self_improvement', color: 'bg-teal-500' },
];

export const DashboardPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const { user } = useAuth();

    const actions = useLoad(actionsApi.list);
    const logs = useLoad(loadLast24h);
    const [search, setSearch] = useState('');

    const q = search.trim().toLowerCase();

    // Default stubs only for a user who really has no actions, never after a failed load.
    // The search matches action names here and action names or notes in the logs below.
    const quickActions = actions.data && (actions.data.length > 0 ? actions.data : DEFAULT_ACTIONS)
        .filter((action) => !q || action.name.toLowerCase().includes(q));

    const filteredLogs = (logs.data ?? []).filter((entry) => {
        if (!q) return true;
        return (
            entry.action?.name.toLowerCase().includes(q) ||
            (entry.log.note ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <PageLayout
            header={
                <TopBar
                    title="Dashboard"
                    left={
                        <div className="flex size-10 shrink-0 items-center overflow-hidden rounded-full border-2 border-primary/20">
                            {user?.avatarUrl ? (
                                <img alt="Profile" className="w-full h-full object-cover" src={user.avatarUrl} />
                            ) : (
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                                </div>
                            )}
                        </div>
                    }
                    right={<TopBarButton icon="settings" label="Settings" onClick={() => navigate('/settings')} />}
                />
            }
        >
            <main className="flex-1 w-full px-4 pb-32">
                {/* Search */}
                <section className="mt-6 mb-8">
                    <h2 className="text-2xl font-bold leading-tight mb-4">What are you doing now?</h2>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-primary">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="block w-full p-4 pl-12 text-base rounded-xl border-none bg-slate-200/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-500 transition-all outline-none"
                            placeholder="Search actions or habits..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <button
                            className="text-primary text-sm font-medium hover:underline"
                            onClick={() => navigate('/manage-actions')}
                        >
                            Edit Grid
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {actions.error ? (
                            <div className="col-span-2">
                                <ErrorState message={actions.error} onRetry={actions.reload} />
                            </div>
                        ) : actions.loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex flex-col items-start p-4 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 border border-transparent">
                                    <div className="size-10 rounded-lg skeleton mb-3" />
                                    <div className="h-4 w-24 skeleton" />
                                </div>
                            ))
                        ) : (
                            <div className="grid grid-cols-2 gap-4 col-span-2 animate-fade-in">
                                {quickActions?.map((action) => {
                                    const isReal = !action.id.startsWith('__default_');
                                    return (
                                        <button
                                            key={action.id}
                                            // A starter action does not exist yet: open New Action filled in with it
                                            onClick={() => navigate(isReal
                                                ? `/register?actionId=${action.id}`
                                                : `/create?${new URLSearchParams({ name: action.name, icon: action.icon })}`)}
                                            className="flex flex-col items-start p-4 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 border border-transparent active:scale-95 transition-transform hover:bg-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <ActionIcon icon={action.icon} color={action.color} className="size-10 rounded-lg mb-3" />
                                            <span className="font-medium text-sm">{action.name}</span>
                                        </button>
                                    );
                                })}

                                {/* New Action button */}
                                <button
                                    onClick={() => navigate('/create')}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 active:scale-95 transition-transform hover:bg-slate-50 dark:hover:bg-slate-900"
                                >
                                    <div className="size-10 rounded-full bg-primary text-background-dark flex items-center justify-center mb-2">
                                        <span className="material-symbols-outlined">add</span>
                                    </div>
                                    <span className="font-medium text-sm text-primary">New Action</span>
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Last 24 Hours */}
                <section className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Last 24 Hours</h3>

                    {logs.error ? (
                        <ErrorState message={logs.error} onRetry={logs.reload} />
                    ) : logs.loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/30 dark:bg-slate-800/30">
                                    <div className="size-10 shrink-0 rounded-full skeleton" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 skeleton" />
                                        <div className="h-3 w-16 skeleton" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {filteredLogs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
                                    <p className="text-sm">No logs yet today. Tap a quick action to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredLogs.map((entry) => (
                                        <div
                                            key={entry.log.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/30 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                                            onClick={() => navigate(`/edit?logId=${entry.log.id}`)}
                                        >
                                            <ActionIcon icon={entry.action?.icon} color={entry.action?.color} className="size-9 rounded-full" iconClassName="text-xl" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{entry.action?.name ?? 'Quick Log'}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(entry.log.loggedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {entry.log.note && (
                                                <span className="text-xs text-slate-400 truncate max-w-[80px]">{entry.log.note}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            <BottomNav activeTab="dashboard" />
        </PageLayout>
    );
};

export default DashboardPage;
