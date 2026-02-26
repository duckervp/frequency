import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TimePicker from '../components/TimePicker';
import { logsApi, type ApiLog } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';

function parseISOToTimePicker(iso: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
    const d = new Date(iso);
    const h24 = d.getHours();
    const minute = d.getMinutes();
    const period: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
    const hour = h24 % 12 || 12;
    return { hour, minute, period };
}

function toISODateTime(hour: number, minute: number, period: 'AM' | 'PM', originalISO: string): string {
    let h = hour % 12;
    if (period === 'PM') h += 12;
    const d = new Date(originalISO);
    d.setHours(h, minute, 0, 0);
    return d.toISOString();
}

export const EditActionPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const logId = searchParams.get('logId');

    const [logData, setLogData] = useState<ApiLog | null>(null);
    const [note, setNote] = useState('');
    const [hour, setHour] = useState(6);
    const [minute, setMinute] = useState(30);
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!logId) return;
        setLoading(true);
        logsApi.get(logId).then((data) => {
            setLogData(data);
            setNote(data.log.note ?? '');
            const t = parseISOToTimePicker(data.log.loggedAt);
            setHour(t.hour);
            setMinute(t.minute);
            setPeriod(t.period);
        }).finally(() => setLoading(false));
    }, [logId]);

    const handleSave = async () => {
        if (!logId || !logData) return;
        setSaving(true);
        setError('');
        try {
            await logsApi.update(logId, {
                loggedAt: toISODateTime(hour, minute, period, logData.log.loggedAt),
                note,
            });
            navigate(-1);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!logId) return;
        if (!window.confirm('Delete this log entry?')) return;
        setDeleting(true);
        try {
            await logsApi.remove(logId);
            navigate('/dashboard');
        } finally {
            setDeleting(false);
        }
    };

    const actionName = logData?.action?.name ?? 'Action Log';
    const logDate = logData
        ? new Date(logData.log.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—';

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
            <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col">

                {/* Header */}
                <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center p-4 justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h1 className="text-lg font-bold leading-tight tracking-tight">Edit Action Log</h1>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center justify-center size-10 rounded-full hover:bg-rose-500/10 transition-colors text-rose-500 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 px-4 pt-4 pb-36 overflow-y-auto hide-scrollbar space-y-6">

                    {/* Action Info Card */}
                    {loading ? (
                        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                            <div className="size-12 rounded-lg skeleton shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-32 skeleton" />
                                <div className="h-4 w-24 skeleton" />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 animate-fade-in">
                            <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-3xl">
                                    {logData?.action?.icon ?? 'task_alt'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{actionName}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Today, {logDate}</p>
                            </div>
                        </div>
                    )}

                    {/* Log Time */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                            <h2 className="text-base font-bold uppercase tracking-wider">Log Time</h2>
                        </div>
                        <TimePicker
                            hour={hour}
                            minute={minute}
                            period={period}
                            onHourChange={setHour}
                            onMinuteChange={setMinute}
                            onPeriodChange={setPeriod}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Adjust the time this action was performed.</p>
                    </section>

                    {/* Private Note */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">notes</span>
                            <h2 className="text-base font-bold uppercase tracking-wider">Private Note</h2>
                        </div>
                        <div className="relative">
                            <textarea
                                className="w-full min-h-[160px] p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all resize-none outline-none"
                                placeholder="Add thoughts or details about this action..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 bg-background-light dark:bg-background-dark px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 pointer-events-none">
                                Encrypted
                            </div>
                        </div>
                    </section>

                    {/* Info Banner */}
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-primary shrink-0">info</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Updates to this log are synced across your devices.
                            </p>
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-background-dark font-bold text-lg rounded-xl flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-60"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full h-12 bg-transparent text-slate-500 dark:text-slate-400 font-medium text-sm rounded-xl flex items-center justify-center hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancel and Discard
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EditActionPage;
