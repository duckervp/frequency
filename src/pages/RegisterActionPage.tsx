import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TimePicker from '../components/TimePicker';
import { logsApi, actionsApi, type ApiAction } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';

// Helper: convert 12-hour picker values to ISO loggedAt string
function toISODateTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
    let h = hour % 12;
    if (period === 'PM') h += 12;
    const now = new Date();
    now.setHours(h, minute, 0, 0);
    return now.toISOString();
}

export const RegisterActionPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const actionId = searchParams.get('actionId');

    const now = new Date();
    const initHour = now.getHours() % 12 || 12;
    const initPeriod: 'AM' | 'PM' = now.getHours() < 12 ? 'AM' : 'PM';

    const [action, setAction] = useState<ApiAction | null>(null);
    const [notes, setNotes] = useState('');
    const [hour, setHour] = useState(initHour);
    const [minute, setMinute] = useState(now.getMinutes());
    const [period, setPeriod] = useState<'AM' | 'PM'>(initPeriod);
    const [loading, setLoading] = useState(!!actionId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!actionId) return;
        setLoading(true);
        actionsApi.list().then((list) => {
            const found = list.find((a: ApiAction) => a.id === actionId);
            if (found) setAction(found);
        }).finally(() => setLoading(false));
    }, [actionId]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await logsApi.create({
                actionId: actionId ?? undefined,
                loggedAt: toISODateTime(hour, minute, period),
                note: notes,
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display flex justify-center">
            <div className="relative flex min-h-screen w-full max-w-md flex-col">

                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <header className="flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 p-4 pb-2 justify-between border-b border-slate-200 dark:border-primary/10">
                    <div
                        className="flex size-12 shrink-0 items-center justify-start cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Register Action</h2>
                    <div className="flex w-12 items-center justify-end">
                        <button
                            className="flex items-center justify-center rounded-lg h-12 text-primary transition-opacity hover:opacity-80"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <span className="material-symbols-outlined text-2xl">check_circle</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable content */}
                <main className="flex-1 flex flex-col px-4 pt-6 overflow-y-auto hide-scrollbar pb-36">

                    {/* Action Title */}
                    <div className="mb-8 text-center min-h-[72px] flex flex-col items-center justify-center">
                        {loading ? (
                            <>
                                <div className="h-4 w-16 skeleton mb-2" />
                                <div className="h-8 w-48 skeleton" />
                            </>
                        ) : (
                            <div className="animate-fade-in">
                                <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-1 block">Tracking</span>
                                <h1 className="text-3xl font-bold leading-tight">
                                    {action ? action.name : 'Quick Log'}
                                </h1>
                            </div>
                        )}
                    </div>

                    {/* Time Picker */}
                    <section className="mb-8">
                        <h3 className="text-slate-500 dark:text-primary/60 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Set Time
                        </h3>
                        <TimePicker
                            hour={hour}
                            minute={minute}
                            period={period}
                            onHourChange={setHour}
                            onMinuteChange={setMinute}
                            onPeriodChange={setPeriod}
                        />
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 text-center italic">
                            Defaulted to current time
                        </p>
                    </section>

                    {/* Private Notes */}
                    <section className="mb-8">
                        <label className="flex flex-col w-full">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <p className="text-base font-semibold">Private Notes</p>
                                <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 text-xl">lock</span>
                            </div>
                            <textarea
                                className="w-full resize-none rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-primary/20 bg-white dark:bg-primary/5 placeholder:text-slate-400 dark:placeholder:text-slate-600 p-4 text-base font-normal leading-relaxed min-h-[140px]"
                                placeholder="Add specific details about this session..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </label>
                    </section>

                    {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

                    {/* Meta Info */}
                    {action && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-100 dark:bg-primary/5 rounded-xl p-4 flex flex-col gap-1 border border-transparent dark:border-primary/10">
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Action</span>
                                <span className="font-medium">{action.name}</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-primary/5 rounded-xl p-4 flex flex-col gap-1 border border-transparent dark:border-primary/10">
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Reminder</span>
                                <span className="font-medium">{action.remindersEnabled ? action.reminderTime : 'Off'}</span>
                            </div>
                        </div>
                    )}
                </main>

                {/* Fixed Save Button */}
                <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-4 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/95 dark:via-background-dark/95 to-transparent pointer-events-none z-20">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="pointer-events-auto w-full bg-primary hover:bg-primary/90 text-background-dark font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined font-bold">save</span>
                        {saving ? 'Saving…' : 'Save Action'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default RegisterActionPage;
