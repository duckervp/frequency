import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import CalendarSelect from '../components/CalendarSelect';
import CalendarGrid from '../components/CalendarGrid';
import CalendarStats from '../components/CalendarStats';
import ActionItem from '../components/ActionItem';
import ErrorState from '../components/ErrorState';
import { logsApi, actionsApi, errorMessage, localDayRange, localMonthRange, type ApiLog } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';
import { useAsyncAction, useLoad } from '../hooks/useLoad';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

function monthKey(year: number, month: number): string {
    return toDateStr(year, month, 1).slice(0, 7);
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

    const actionsLoad = useLoad(actionsApi.list);
    const actions = actionsLoad.data ?? [];
    const [filterActionId, setFilterActionId] = useState<string | null>(null);

    // Logs per local month ("YYYY-MM"), fetched one month at a time instead of the whole history
    const [logsByMonth, setLogsByMonth] = useState<Map<string, ApiLog[]>>(new Map());
    const [monthErrors, setMonthErrors] = useState<Map<string, string>>(new Map());
    const monthRequests = useRef(new Map<string, Promise<ApiLog[]>>());
    const remove = useAsyncAction();

    // ── Load logs one month at a time (each month fetched once) ──────────────
    const loadMonth = useCallback((y: number, m: number) => {
        const key = monthKey(y, m);
        let request = monthRequests.current.get(key);
        if (!request) {
            request = logsApi.list(localMonthRange(y, m));
            monthRequests.current.set(key, request);
            request.then(
                (rows) => {
                    setLogsByMonth(prev => new Map(prev).set(key, rows));
                    setMonthErrors(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Map(prev);
                        next.delete(key);
                        return next;
                    });
                },
                (err) => {
                    // Forget the failed request so a retry or a later visit fetches again
                    monthRequests.current.delete(key);
                    setMonthErrors(prev => new Map(prev).set(key, errorMessage(err)));
                },
            );
        }
        return request;
    }, []);

    const retryMonth = () => {
        setMonthErrors(prev => {
            const next = new Map(prev);
            next.delete(monthKey(year, month));
            return next;
        });
        loadMonth(year, month).catch(() => {});
    };

    useEffect(() => {
        loadMonth(year, month).catch(() => {});
    }, [year, month, loadMonth]);

    // Computed by the BE, so the streak never needs the log history on the client
    const loadStreak = useCallback(() => logsApi.streak(filterActionId), [filterActionId]);
    const streak = useLoad(loadStreak);

    const monthLogs = React.useMemo(() => logsByMonth.get(monthKey(year, month)) ?? [], [logsByMonth, year, month]);
    const monthError = monthErrors.get(monthKey(year, month)) ?? '';
    const monthLoading = !logsByMonth.has(monthKey(year, month)) && !monthError;

    // ── Load logs for the selected day ────────────────────────────────────────
    const loadDayLogs = useCallback(
        () => (selectedDay === null ? Promise.resolve([]) : logsApi.list(localDayRange(year, month, selectedDay))),
        [year, month, selectedDay],
    );
    const day = useLoad(loadDayLogs);
    const dayLogs = React.useMemo(() => day.data ?? [], [day.data]);

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this log entry?')) return;
        remove.run(async () => {
            await logsApi.remove(id);
            day.setData(rows => rows.filter(l => l.log.id !== id));
            setLogsByMonth(prev => {
                const next = new Map(prev);
                next.forEach((rows, key) => next.set(key, rows.filter(l => l.log.id !== id)));
                return next;
            });
            streak.reload();
        });
    };

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
        <PageLayout header={<TopBar title="Frequency Tracker" right={<TopBarButton icon="more_horiz" label="More" />} />}>
            <main className="flex-1 w-full px-4 py-6 space-y-6 pb-32">

                {/* Action filter */}
                <CalendarSelect
                    actions={actions}
                    selectedActionId={filterActionId}
                    onChange={setFilterActionId}
                    loading={actionsLoad.loading}
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

                {monthError && <ErrorState message={monthError} onRetry={retryMonth} />}

                {/* Stats */}
                <CalendarStats
                    totalThisMonth={totalThisMonth}
                    currentStreak={streak.data?.streak ?? 0}
                    loading={monthLoading}
                    streakLoading={streak.loading}
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

                        {remove.error && <ErrorState message={remove.error} />}

                        {day.error && <ErrorState message={day.error} onRetry={day.reload} />}

                        {day.loading && (
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

                        {!day.loading && !day.error && (
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
                                                onDelete={() => handleDelete(entry.log.id)}
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
        </PageLayout>
    );
};

export default CalendarPage;
