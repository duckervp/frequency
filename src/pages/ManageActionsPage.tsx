import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { actionsApi, type ApiAction } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';

export const ManageActionsPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const [actions, setActions] = useState<ApiAction[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        actionsApi.list()
            .then(setActions)
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this action? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await actionsApi.remove(id);
            setActions((prev) => prev.filter((a) => a.id !== id));
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = actions.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
            <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Manage Actions</h1>
                <div className="ml-auto">
                    <button
                        onClick={() => navigate('/create')}
                        className="bg-primary text-background-dark p-2 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto hide-scrollbar max-w-md mx-auto w-full px-4 py-6 space-y-6 pb-32">
                {/* Search */}
                <section>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        </div>
                        <input
                            className="w-full bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder="Search your actions..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </section>

                {/* List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Active Habits</h2>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {filtered.length} Total
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-primary/5 border border-slate-100 dark:border-primary/10 rounded-xl p-4 flex items-center gap-4">
                                    <div className="size-11 rounded-lg skeleton" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 skeleton" />
                                        <div className="h-3 w-40 skeleton" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {!loading && filtered.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">sentiment_neutral</span>
                                    <p className="text-sm">No actions yet. Tap + to create one.</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {filtered.map((action) => (
                                    <div key={action.id} className="bg-white dark:bg-primary/5 border border-slate-100 dark:border-primary/10 rounded-xl p-4 flex items-center gap-4 shadow-sm group">
                                        <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
                                            <span className="material-symbols-outlined text-primary">{action.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base truncate">{action.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {action.remindersEnabled ? `Daily • ${action.reminderTime}` : 'No reminder set'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/create?edit=${action.id}`)}
                                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[22px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(action.id)}
                                                disabled={deletingId === action.id}
                                                className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-[22px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>

            <BottomNav activeTab="settings" />
        </div>
    );
};

export default ManageActionsPage;
