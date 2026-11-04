import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TimePicker from '../components/TimePicker';
import ErrorState from '../components/ErrorState';
import { actionsApi, errorMessage, logsApi, renameNotFound, type ApiAction } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';
import { useGoBack } from '../hooks/useGoBack';
import { useLoad } from '../hooks/useLoad';
import { pickedTimeToISO, timeOfDay } from '../lib/time';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';

export const RegisterActionPage: React.FC = () => {
    useRequireAuth();
    const goBack = useGoBack('/dashboard');
    const [searchParams] = useSearchParams();
    const actionId = searchParams.get('actionId');

    // null for a quick log (no actionId); an action that no longer exists is an error, not a quick log
    const loadAction = useCallback(
        async (): Promise<ApiAction | null> =>
            actionId ? actionsApi.get(actionId).catch(renameNotFound('This action no longer exists.')) : null,
        [actionId],
    );
    const actionLoad = useLoad(loadAction);
    const action = actionLoad.data ?? null;
    const loading = actionLoad.loading;

    const [notes, setNotes] = useState('');
    const [time, setTime] = useState(() => timeOfDay());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const canSave = !saving && !loading && !actionLoad.error;

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        setError('');
        try {
            await logsApi.create({
                actionId: action?.id,
                loggedAt: pickedTimeToISO(time),
                note: notes,
            });
            goBack();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout
            header={
                <TopBar
                    title="Register Action"
                    left={<TopBarButton icon="close" label="Close" onClick={goBack} />}
                    right={<TopBarButton icon="check_circle" label="Save" onClick={handleSave} disabled={!canSave} className="text-primary" />}
                />
            }
        >
            {/* Clipped in its own layer: the circles poke out of the column and made the page scroll sideways */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <main className="flex-1 flex flex-col px-4 pt-6 pb-36">

                {/* Action Title */}
                <div className="mb-8 text-center min-h-[72px] flex flex-col items-center justify-center">
                    {actionLoad.error ? (
                        <ErrorState message={actionLoad.error} onRetry={actionLoad.reload} />
                    ) : loading ? (
                        <>
                            <div className="h-4 w-16 skeleton mb-2" />
                            <div className="h-8 w-48 skeleton" />
                        </>
                    ) : (
                        <div className="animate-fade-in">
                            <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-1 block">Tracking</span>
                            <h2 className="text-3xl font-bold leading-tight">
                                {action ? action.name : 'Quick Log'}
                            </h2>
                        </div>
                    )}
                </div>

                {/* Time Picker */}
                <section className="mb-8">
                    <h3 className="text-slate-500 dark:text-primary/60 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Set Time
                    </h3>
                    <TimePicker value={time} onChange={setTime} />
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
                    disabled={!canSave}
                    className="pointer-events-auto w-full bg-primary hover:bg-primary/90 text-background-dark font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                    <span className="material-symbols-outlined font-bold">save</span>
                    {saving ? 'Saving...' : 'Save Action'}
                </button>
            </footer>
        </PageLayout>
    );
};

export default RegisterActionPage;
