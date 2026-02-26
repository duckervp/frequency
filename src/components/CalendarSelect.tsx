import React, { useState, useRef, useEffect } from 'react';
import type { ApiAction } from '../lib/api';

interface CalendarSelectProps {
    actions: ApiAction[];
    selectedActionId: string | null; // null = all actions
    onChange: (actionId: string | null) => void;
    loading?: boolean;
}

export const CalendarSelect: React.FC<CalendarSelectProps> = ({
    actions, selectedActionId, onChange, loading,
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedAction = actions.find(a => a.id === selectedActionId);
    const labelText = selectedAction ? selectedAction.name : 'All Actions';

    return (
        <section className="space-y-2" ref={ref}>
            <label className="text-sm font-medium text-slate-500 dark:text-primary/70 ml-1">
                Tracked Action
            </label>

            <button
                onClick={() => setOpen(prev => !prev)}
                disabled={loading}
                className="w-full h-14 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl px-4 flex items-center justify-between transition-all outline-none focus:ring-2 focus:ring-primary font-medium text-slate-900 dark:text-slate-100 cursor-pointer disabled:opacity-60"
            >
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">
                        {selectedAction ? selectedAction.icon : 'apps'}
                    </span>
                    <span>{loading ? 'Loading actions…' : labelText}</span>
                </span>
                <span
                    className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                >
                    expand_more
                </span>
            </button>

            {open && (
                <div className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl shadow-lg overflow-hidden z-10">
                    {/* All Actions option */}
                    <button
                        onClick={() => { onChange(null); setOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-primary/10 font-medium ${!selectedActionId ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                        <span className="material-symbols-outlined text-xl">apps</span>
                        <span className="flex-1">All Actions</span>
                        {!selectedActionId && (
                            <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                        )}
                    </button>

                    {actions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => { onChange(action.id); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-primary/10 font-medium ${selectedActionId === action.id ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                            <span className="material-symbols-outlined text-xl">{action.icon}</span>
                            <span className="flex-1">{action.name}</span>
                            {selectedActionId === action.id && (
                                <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                            )}
                        </button>
                    ))}

                    {!loading && actions.length === 0 && (
                        <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                            No actions yet — create one first!
                        </p>
                    )}
                </div>
            )}
        </section>
    );
};

export default CalendarSelect;
