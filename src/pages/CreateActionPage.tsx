import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { actionsApi, type ApiAction } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';

export const CreateActionPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    const [actionName, setActionName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('book');
    const [selectedColor, setSelectedColor] = useState('bg-primary');
    const [remindersEnabled, setRemindersEnabled] = useState(true);
    const [reminderTime, setReminderTime] = useState('08:00');
    const [loading, setLoading] = useState(!!editId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const icons = [
        'book', 'directions_run', 'self_improvement', 'code',
        'bedtime', 'water_drop', 'restaurant', 'fitness_center'
    ];
    const colors = [
        'bg-primary', 'bg-blue-400', 'bg-purple-400',
        'bg-orange-400', 'bg-pink-400', 'bg-yellow-400'
    ];

    // If editing, load existing action
    useEffect(() => {
        if (!editId) return;
        setLoading(true);
        actionsApi.list().then((list) => {
            const found = list.find((a: ApiAction) => a.id === editId);
            if (found) {
                setActionName(found.name);
                setSelectedIcon(found.icon);
                setSelectedColor(found.color);
                setRemindersEnabled(found.remindersEnabled);
                setReminderTime(found.reminderTime ?? '08:00');
            }
        }).finally(() => setLoading(false));
    }, [editId]);

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
                reminderTime,
            };
            if (editId) {
                await actionsApi.update(editId, payload);
            } else {
                await actionsApi.create(payload);
            }
            navigate('/manage-actions');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save action');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex justify-center">
            <div className="relative flex h-full min-h-screen w-full max-w-md flex-col bg-background-light dark:bg-background-dark overflow-x-hidden shadow-2xl">

                {/* Top Navigation Bar */}
                <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-3 justify-between border-b border-slate-200 dark:border-slate-800">
                    <div
                        className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start cursor-pointer transition-colors hover:text-primary"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-symbols-outlined text-[28px]">close</span>
                    </div>
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-semibold leading-tight tracking-tight flex-1 text-center">
                        {editId ? 'Edit Action' : 'New Action'}
                    </h2>
                    <div
                        className="flex size-10 items-center justify-end cursor-pointer transition-opacity hover:opacity-80"
                        onClick={handleSave}
                    >
                        <p className="text-primary text-base font-semibold leading-normal">
                            {saving ? '...' : 'Done'}
                        </p>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex flex-col gap-6 px-4 py-6 pb-32">
                    {loading ? (
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
                    ) : (
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
                                    {icons.map(icon => (
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
                                        {colors.map(colorClass => (
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
                    )}
                </div>

                {/* Floating Save Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent max-w-md mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-2xl text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                        {saving ? 'Saving…' : editId ? 'Update Action' : 'Create Action'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateActionPage;
