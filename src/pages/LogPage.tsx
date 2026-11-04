import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';
import SummaryCard from '../components/SummaryCard';
import ActionItem from '../components/ActionItem';
import BottomNav from '../components/BottomNav';
import { logsApi, localDayRange, type DayRange } from '../lib/api';
import { useAsyncAction, useLoad } from '../hooks/useLoad';
import { useRequireAuth } from '../hooks/useAuth';
import { useToday } from '../hooks/useToday';
import { localDateKey, parseDateKey } from '../lib/time';
import { actionIcon } from '../lib/icons';

// ── Date pill helpers ──────────────────────────────────────────────────────────

/** The last `count` local days ending at `today` (YYYY-MM-DD), newest first */
function buildDatePills(today: string, count = 7) {
    const { year, month, day: date } = parseDateKey(today);
    const pills: { label: string; dateStr: string; range: DayRange }[] = [];
    for (let i = 0; i < count; i++) {
        const day = new Date(year, month, date - i);
        const label = i === 0
            ? 'Today'
            : i === 1
                ? 'Yesterday'
                : day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        pills.push({ label, dateStr: localDateKey(day), range: localDayRange(day.getFullYear(), day.getMonth(), day.getDate()) });
    }
    return pills;
}

// ── LogPage ───────────────────────────────────────────────────────────────────

export const LogPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();

    // Pills follow the local date, so a tab left open past midnight moves on to the new day
    const today = useToday();
    const datePills = useMemo(() => buildDatePills(today), [today]);
    // null = Today, so "Today" follows the date across midnight while a past day stays that day
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const selectedIndex = Math.max(0, datePills.findIndex(p => p.dateStr === selectedDate));
    const selectedPill = datePills[selectedIndex];
    // Formatted here, not taken from /stats: the server formats dates in its own timezone
    const todayLabel = `Today, ${new Date(datePills[0].range.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const isToday = selectedIndex === 0;

    const loadDay = useCallback(async () => {
        const [logs, stats] = await Promise.all([logsApi.list(selectedPill.range), logsApi.stats(datePills[0].range)]);
        return { logs, totalToday: stats.totalToday };
    }, [selectedPill, datePills]);
    const day = useLoad(loadDay);
    const remove = useAsyncAction();
    const logs = day.data?.logs ?? [];

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete log?')) return;
        remove.run(async () => {
            await logsApi.remove(id);
            day.setData(d => ({
                logs: d.logs.filter(l => l.log.id !== id),
                totalToday: isToday ? d.totalToday - 1 : d.totalToday,
            }));
        });
    };


    return (
        <PageLayout header={<TopBar title={todayLabel} right={<TopBarButton icon="more_horiz" label="More" />} />}>
            <main className="flex-1 w-full pb-32">
                <SummaryCard
                    coverImage="/images/log-summary.webp"
                    totalActions={day.data?.totalToday ?? 0}
                    loading={day.loading}
                />

                {/* Date pills */}
                <div className="px-4 py-4 flex gap-2 overflow-x-auto hide-scrollbar">
                    {datePills.map((pill, i) => (
                        <button
                            key={pill.dateStr}
                            onClick={() => setSelectedDate(i === 0 ? null : pill.dateStr)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedIndex === i
                                ? 'bg-primary text-background-dark shadow-md shadow-primary/20'
                                : 'bg-slate-200/60 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                        >
                            {pill.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between px-4 pb-2">
                    <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">
                        Action Log
                    </h3>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {selectedPill.label}
                    </span>
                </div>

                {remove.error && (
                    <div className="px-4 pb-3">
                        <ErrorState message={remove.error} />
                    </div>
                )}

                <div className="space-y-1">
                    {day.error ? (
                        <div className="px-4">
                            <ErrorState message={day.error} onRetry={day.reload} />
                        </div>
                    ) : day.loading ? (
                        <div className="space-y-3 px-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-200/30 dark:bg-slate-800/30">
                                    <div className="size-10 shrink-0 rounded-full skeleton" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 skeleton" />
                                        <div className="h-3 w-16 skeleton" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {logs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
                                    <p className="text-sm">
                                        {isToday
                                            ? 'No actions logged today yet.'
                                            : 'No actions logged on this day.'}
                                    </p>
                                </div>
                            ) : (
                                logs.map((entry) => (
                                    <ActionItem
                                        key={entry.log.id}
                                        title={entry.action?.name ?? 'Quick Log'}
                                        time={new Date(entry.log.loggedAt).toLocaleTimeString('en-US', {
                                            hour: 'numeric', minute: '2-digit',
                                        })}
                                        note={entry.log.note ?? ''}
                                        category="Logged"
                                        icon={actionIcon(entry.action?.icon)}
                                        onEdit={() => navigate(`/edit?logId=${entry.log.id}`)}
                                        onDelete={() => handleDelete(entry.log.id)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            <BottomNav activeTab="log" showFab />
        </PageLayout>
    );
};

export default LogPage;
