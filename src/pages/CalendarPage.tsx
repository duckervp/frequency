import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import CalendarSelect from '../components/CalendarSelect';
import CalendarGrid from '../components/CalendarGrid';
import CalendarStats from '../components/CalendarStats';
import ActionItem from '../components/ActionItem';
import { logsApi, actionsApi, type ApiLog, type ApiAction } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

/** Compute streak: count consecutive days (going backwards from today) that have at least one log */
function computeStreak(logsByDay: Map<string, number>): number {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (true) {
        const key = cursor.toISOString().slice(0, 10);
        if (logsByDay.has(key) && logsByDay.get(key)! > 0) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

// ── CalendarPage ──────────────────────────────────────────────────────────────

export const CalendarPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();

    const today = new Date();

    // ── State ─────────────────────────────────────────────────────────────────
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0-indexed
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

    const [actions, setActions] = useState<ApiAction[]>([]);
    const [filterActionId, setFilterActionId] = useState<string | null>(null);
    const [actionsLoading, setActionsLoading] = useState(true);

    // Logs for the full displayed month (to compute active days)
    const [monthLogs, setMonthLogs] = useState<ApiLog[]>([]);
    const [monthLoading, setMonthLoading] = useState(true);

    // Logs for the selected day detail view
    const [dayLogs, setDayLogs] = useState<ApiLog[]>([]);
    const [dayLoading, setDayLoading] = useState(false);

    // ── Load actions once ─────────────────────────────────────────────────────
    useEffect(() => {
        actionsApi.list()
            .then(setActions)
            .finally(() => setActionsLoading(false));
    }, []);

    // ── Load logs for the whole month whenever month/year/filter changes ──────
    const loadMonthLogs = useCallback(async () => {
        setMonthLoading(true);
        try {
            // Fetch each day of the month is expensive — instead fetch the whole month
            // by using a date prefix (the API supports date= for a single day;
            // we'll fetch all user logs and filter client-side for the month view).
            const all = await logsApi.list();
            setMonthLogs(all);
        } finally {
            setMonthLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMonthLogs();
    }, [loadMonthLogs]);

    // ── Load logs for the selected day ────────────────────────────────────────
    const loadDayLogs = useCallback(async (d: number) => {
        setDayLoading(true);
        try {
            const dateStr = toDateStr(year, month, d);
            const rows = await logsApi.list({ date: dateStr });
            setDayLogs(rows);
        } finally {
            setDayLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        if (selectedDay !== null) {
            loadDayLogs(selectedDay);
        }
    }, [selectedDay, loadDayLogs]);

    // ── Derived: active days for the month (filtered by action if any) ────────
    const activeDays = React.useMemo(() => {
        const set = new Set<number>();
        monthLogs.forEach((entry) => {
            const d = new Date(entry.log.loggedAt);
            if (d.getFullYear() !== year || d.getMonth() !== month) return;
            if (filterActionId && entry.log.actionId !== filterActionId) return;
            set.add(d.getDate());
        });
        return set;
    }, [monthLogs, year, month, filterActionId]);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const totalThisMonth = React.useMemo(() => {
        return monthLogs.filter((entry) => {
            const d = new Date(entry.log.loggedAt);
            if (d.getFullYear() !== year || d.getMonth() !== month) return false;
            if (filterActionId && entry.log.actionId !== filterActionId) return false;
            return true;
        }).length;
    }, [monthLogs, year, month, filterActionId]);

    const currentStreak = React.useMemo(() => {
        // Build a map of date → count from all logs (no action filter for streak calculation)
        const byDay = new Map<string, number>();
        monthLogs.forEach((entry) => {
            const key = entry.log.loggedAt.slice(0, 10);
            byDay.set(key, (byDay.get(key) ?? 0) + 1);
        });
        return computeStreak(byDay);
    }, [monthLogs]);

    // ── Filtered day logs ─────────────────────────────────────────────────────
    const filteredDayLogs = React.useMemo(() => {
        if (!filterActionId) return dayLogs;
        return dayLogs.filter(e => e.log.actionId === filterActionId);
    }, [dayLogs, filterActionId]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const handlePrevMonth = () => {
        setSelectedDay(null);
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const handleNextMonth = () => {
        setSelectedDay(null);
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const handleDaySelect = (day: number) => {
        setSelectedDay(day === selectedDay ? null : day);
    };

    const selectedDateLabel = selectedDay !== null
        ? new Date(year, month, selectedDay).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
        })
        : null;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
            <Header title="Frequency Tracker" />

            <main className="flex-1 overflow-y-auto hide-scrollbar max-w-md mx-auto w-full px-4 py-6 space-y-6 pb-32">

                {/* Action filter */}
                <CalendarSelect
                    actions={actions}
                    selectedActionId={filterActionId}
                    onChange={setFilterActionId}
                    loading={actionsLoading}
                />

                {/* Month grid */}
                <CalendarGrid
                    year={year}
                    month={month}
                    activeDays={activeDays}
                    selectedDay={selectedDay}
                    onDaySelect={handleDaySelect}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                />

                {/* Stats */}
                <CalendarStats
                    totalThisMonth={totalThisMonth}
                    currentStreak={currentStreak}
                    loading={monthLoading}
                />

                {/* Day detail panel */}
                {selectedDay !== null && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {selectedDateLabel}
                            </h3>
                            {filteredDayLogs.length > 0 && (
                                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    {filteredDayLogs.length} {filteredDayLogs.length === 1 ? 'log' : 'logs'}
                                </span>
                            )}
                        </div>

                        {dayLoading && (
                            <div className="space-y-3">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/30 dark:bg-slate-800/30">
                                        <div className="size-10 shrink-0 rounded-full skeleton" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-32 skeleton" />
                                            <div className="h-3 w-16 skeleton" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!dayLoading && (
                            <div className="animate-fade-in">
                                {filteredDayLogs.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <span className="material-symbols-outlined text-3xl mb-2 block">event_busy</span>
                                        <p className="text-sm">No logs recorded for this day.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredDayLogs.map((entry) => (
                                            <ActionItem
                                                key={entry.log.id}
                                                title={entry.action?.name ?? 'Quick Log'}
                                                time={new Date(entry.log.loggedAt).toLocaleTimeString('en-US', {
                                                    hour: 'numeric', minute: '2-digit',
                                                })}
                                                note={entry.log.note ?? ''}
                                                category="Logged"
                                                icon={entry.action?.icon ?? 'task_alt'}
                                                onEdit={() => navigate(`/edit?logId=${entry.log.id}`)}
                                                onDelete={async () => {
                                                    if (window.confirm('Delete this log entry?')) {
                                                        await logsApi.remove(entry.log.id);
                                                        setDayLogs(prev => prev.filter(l => l.log.id !== entry.log.id));
                                                        setMonthLogs(prev => prev.filter(l => l.log.id !== entry.log.id));
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>

            <BottomNav activeTab="calendar" showFab />
        </div>
    );
};

export default CalendarPage;
