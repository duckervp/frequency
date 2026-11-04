import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { actionsApi, errorMessage, renameNotFound, type ApiAction } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';
import { useGoBack } from '../hooks/useGoBack';
import { useLoad } from '../hooks/useLoad';
import { ACTION_ICONS } from '../lib/icons';
import ErrorState from '../components/ErrorState';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';
import { ACTION_COLORS } from '../lib/colors';


export const CreateActionPage: React.FC = () => {
    useRequireAuth();
    const goBack = useGoBack('/manage-actions');
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    // Edit mode loads the action first; the form then starts from it instead of placeholder values
    const loadAction = useCallback(
        async (): Promise<ApiAction | null> =>
            editId ? actionsApi.get(editId).catch(renameNotFound('This action no longer exists.')) : null,
        [editId],
    );
    const action = useLoad(loadAction);

    if (action.data !== undefined) {
        // New Action can be opened prefilled (?name=&icon=), e.g. from a starter action on the dashboard
        const icon = searchParams.get('icon');
        const preset = { name: searchParams.get('name') ?? '', icon: icon && ACTION_ICONS.includes(icon) ? icon : undefined };
        return <ActionForm key={editId ?? 'new'} editId={editId} initial={action.data} preset={preset} />;
    }

    return (
        <PageLayout
            header={
                <TopBar
                    title={editId ? 'Edit Action' : 'New Action'}
                    left={<TopBarButton icon="close" label="Close" onClick={goBack} />}
                />
            }
        >
            <div className="flex flex-col gap-6 px-4 py-6 pb-32">
                {action.error ? (
                    <ErrorState message={action.error} onRetry={action.reload} />
                ) : (
                    <div className="space-y-8 animate-pulse">
                        <div className="space-y-3">
                            <div className="h-4 w-24 skeleton" />
                            <div className="h-14 w-full skeleton rounded-xl" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 w-24 skeleton" />
                            <div className="grid grid-cols-4 gap-3">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="aspect-square skeleton rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

interface ActionFormProps {
    editId: string | null;
    initial: ApiAction | null;
    preset: { name: string; icon?: string };
}

const ActionForm: React.FC<ActionFormProps> = ({ editId, initial, preset }) => {
    const goBack = useGoBack('/manage-actions');
    const [actionName, setActionName] = useState(initial?.name ?? preset.name);
    const [selectedIcon, setSelectedIcon] = useState(initial?.icon ?? preset.icon ?? 'book');
    const [selectedColor, setSelectedColor] = useState(initial?.color ?? 'bg-primary');
    const [remindersEnabled, setRemindersEnabled] = useState(initial?.remindersEnabled ?? true);
    const [reminderTime, setReminderTime] = useState(initial?.reminderTime ?? '08:00');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!actionName.trim()) { setError('Please enter an action name.'); return; }
        setError('');
        setSaving(true);
        try {
            const payload = {
                name: actionName,
                icon: selectedIcon,
                color: selectedColor,
                remindersEnabled,
                // A cleared time input gives '': keep the stored time rather than sending an invalid one
                ...(reminderTime && { reminderTime }),
            };
            if (editId) {
                await actionsApi.update(editId, payload);
            } else {
                await actionsApi.create(payload);
            }
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
                    title={editId ? 'Edit Action' : 'New Action'}
                    left={<TopBarButton icon="close" label="Close" onClick={goBack} />}
                    right={
                        <button
                            type="button"
                            className="h-10 px-1 text-primary text-base font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? '...' : 'Done'}
                        </button>
                    }
                />
            }
        >
            {/* Form Content */}
            <div className="flex flex-col gap-6 px-4 py-6 pb-32">
                <div className="animate-fade-in space-y-6">
                    {error && <p className="text-red-400 text-sm text-center -mb-2">{error}</p>}

                    {/* Action Name */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Action Name</h3>
                        <label className="flex flex-col w-full">
                            <input
                                className="flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-slate-100 dark:bg-slate-800/50 h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-lg font-medium leading-normal"
                                placeholder="e.g., Read Book"
                                type="text"
                                value={actionName}
                                onChange={(e) => setActionName(e.target.value)}
                            />
                        </label>
                    </section>

                    {/* Icon Selector */}
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Select Icon</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {ACTION_ICONS.map(icon => (
                                <button
                                    key={icon}
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`flex flex-col aspect-square gap-2 rounded-xl p-4 items-center justify-center cursor-pointer transition-colors ${selectedIcon === icon ? 'border-2 border-primary bg-primary/10' : 'border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                >
                                    <span className={`material-symbols-outlined text-[32px] ${selectedIcon === icon ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>{icon}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Color */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Category Color</h3>
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <div className="flex gap-3">
                                {ACTION_COLORS.map(colorClass => (
                                    <button
                                        key={colorClass}
                                        onClick={() => setSelectedColor(colorClass)}
                                        className={`size-8 rounded-full ${colorClass} transition-all ${selectedColor === colorClass ? 'ring-4 ring-primary/20 scale-110' : 'hover:scale-105'}`}
                                    />
                                ))}
                            </div>
                            <span className="material-symbols-outlined text-slate-400">palette</span>
                        </div>
                    </section>

                    {/* Reminders */}
                    <section className="flex flex-col gap-2">
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Reminders</h3>
                        <div className="flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-700/50">
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/70 transition-colors rounded-t-xl"
                                onClick={() => setRemindersEnabled(!remindersEnabled)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-500">notifications</span>
                                    <span className="text-base font-medium">Daily Notification</span>
                                </div>
                                <div className={`w-12 h-7 rounded-full relative transition-colors ${remindersEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <div className={`absolute top-1 size-5 bg-white rounded-full shadow-sm transition-transform ${remindersEnabled ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                            <div className={`flex items-center justify-between p-4 rounded-b-xl ${!remindersEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-500">schedule</span>
                                    <span className="text-base font-medium">Set Time</span>
                                </div>
                                <input
                                    type="time"
                                    value={reminderTime}
                                    onChange={(e) => setReminderTime(e.target.value)}
                                    className="bg-transparent text-slate-500 dark:text-slate-300 text-base outline-none"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent max-w-md mx-auto">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-2xl text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                    {saving ? 'Saving...' : editId ? 'Update Action' : 'Create Action'}
                </button>
            </div>
        </PageLayout>
    );
};

export default CreateActionPage;
