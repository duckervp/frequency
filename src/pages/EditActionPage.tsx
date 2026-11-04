import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TimePicker from '../components/TimePicker';
import ErrorState from '../components/ErrorState';
import { ApiError, errorMessage, logsApi, type ApiLog } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';
import { useGoBack } from '../hooks/useGoBack';
import { useAsyncAction, useLoad } from '../hooks/useLoad';
import { formatLogDay, timeOfDay, withLocalTime } from '../lib/time';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';
import ActionIcon from '../components/ActionIcon';

export const EditActionPage: React.FC = () => {
    useRequireAuth();
    const goBack = useGoBack('/dashboard');
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
            goBack();
        });
    };

    return (
        <PageLayout
            header={
                <TopBar
                    title="Edit Action Log"
                    left={<TopBarButton icon="close" label="Close" onClick={goBack} />}
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
    const goBack = useGoBack('/dashboard');
    const [note, setNote] = useState(entry.log.note ?? '');
    const [time, setTime] = useState(() => timeOfDay(new Date(entry.log.loggedAt)));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const loggedAt = withLocalTime(entry.log.loggedAt, time);
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
            goBack();
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
                <ActionIcon icon={entry.action?.icon} color={entry.action?.color} className="size-12 rounded-lg" iconClassName="text-3xl" />
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
                <TimePicker value={time} onChange={setTime} />
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
                </div>
            </section>

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
                    onClick={goBack}
                    className="w-full h-12 bg-transparent text-slate-500 dark:text-slate-400 font-medium text-sm rounded-xl flex items-center justify-center hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                    Cancel and Discard
                </button>
            </div>
        </>
    );
};

export default EditActionPage;
