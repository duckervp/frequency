import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TimePicker from '../components/TimePicker';
import ErrorState from '../components/ErrorState';
import { ApiError, errorMessage, logsApi, type ApiLog } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';
import { useAsyncAction, useLoad } from '../hooks/useLoad';
import { formatLogDay, withLocalTime } from '../lib/time';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';
import { actionIcon } from '../lib/icons';

function parseISOToTimePicker(iso: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
    const d = new Date(iso);
    const h24 = d.getHours();
    const minute = d.getMinutes();
    const period: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
    const hour = h24 % 12 || 12;
    return { hour, minute, period };
}

export const EditActionPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const logId = searchParams.get('logId');

    // null: no id in the URL, or the log does not exist (deleted, or someone else's)
    const loadEntry = useCallback(async (): Promise<ApiLog | null> => {
        if (!logId) return null;
        try {
            return await logsApi.get(logId);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
        }
    }, [logId]);
    const entry = useLoad(loadEntry);
    const remove = useAsyncAction();

    const handleDelete = () => {
        if (!logId || !window.confirm('Delete this log entry?')) return;
        remove.run(async () => {
            await logsApi.remove(logId);
            navigate('/dashboard');
        });
    };

    return (
        <PageLayout
            header={
                <TopBar
                    title="Edit Action Log"
                    left={<TopBarButton icon="close" label="Close" onClick={() => navigate(-1)} />}
                    right={entry.data && (
                        <TopBarButton
                            icon="delete"
                            label="Delete log"
                            onClick={handleDelete}
                            disabled={remove.busy}
                            className="text-rose-500 hover:bg-rose-500/10"
                        />
                    )}
                />
            }
        >
            <main className="flex-1 px-4 pt-4 pb-36 space-y-6">
                {remove.error && <ErrorState message={remove.error} />}

                {entry.error ? (
                    <ErrorState message={entry.error} onRetry={entry.reload} />
                ) : entry.loading ? (
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                        <div className="size-12 rounded-lg skeleton shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-32 skeleton" />
                            <div className="h-4 w-24 skeleton" />
                        </div>
                    </div>
                ) : entry.data ? (
                    <EditLogForm key={entry.data.log.id} entry={entry.data} />
                ) : (
                    <ErrorState message="This log could not be found. It may have been deleted." />
                )}
            </main>
        </PageLayout>
    );
};

/** The form starts from the loaded log, so it never shows placeholder values while loading */
const EditLogForm: React.FC<{ entry: ApiLog }> = ({ entry }) => {
    const navigate = useNavigate();
    const initial = parseISOToTimePicker(entry.log.loggedAt);
    const [note, setNote] = useState(entry.log.note ?? '');
    const [hour, setHour] = useState(initial.hour);
    const [minute, setMinute] = useState(initial.minute);
    const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const loggedAt = withLocalTime(entry.log.loggedAt, hour, minute, period);
        if (loggedAt > new Date()) {
            setError("The time can't be in the future");
            return;
        }
        setSaving(true);
        setError('');
        try {
            await logsApi.update(entry.log.id, {
                loggedAt: loggedAt.toISOString(),
                note,
            });
            navigate(-1);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Action Info Card */}
            <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 animate-fade-in">
                <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-3xl">
                        {actionIcon(entry.action?.icon)}
                    </span>
                </div>
                <div>
                    <h3 className="font-bold text-lg">{entry.action?.name ?? 'Action Log'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{formatLogDay(entry.log.loggedAt)}</p>
                </div>
            </div>

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
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="w-full h-12 bg-transparent text-slate-500 dark:text-slate-400 font-medium text-sm rounded-xl flex items-center justify-center hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                    Cancel and Discard
                </button>
            </div>
        </>
    );
};

export default EditActionPage;
