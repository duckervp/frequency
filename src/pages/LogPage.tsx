import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SummaryCard from '../components/SummaryCard';
import ActionItem from '../components/ActionItem';
import BottomNav from '../components/BottomNav';
import { logsApi, type ApiLog } from '../lib/api';
import { useRequireAuth } from '../hooks/useAuth';

// ── Date pill helpers ──────────────────────────────────────────────────────────

function buildDatePills(count = 7) {
    const pills: { label: string; dateStr: string }[] = [];
    for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const label = i === 0
            ? 'Today'
            : i === 1
                ? 'Yesterday'
                : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        pills.push({ label, dateStr });
    }
    return pills;
}

const DATE_PILLS = buildDatePills(7);

// ── LogPage ───────────────────────────────────────────────────────────────────

export const LogPage: React.FC = () => {
    useRequireAuth();
    const navigate = useNavigate();

    const [selectedDateStr, setSelectedDateStr] = useState(DATE_PILLS[0].dateStr);
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [stats, setStats] = useState({ totalToday: 0, dateInfo: 'Today' });
    const [loading, setLoading] = useState(true);

    const loadLogs = useCallback(async (dateStr: string) => {
        setLoading(true);
        try {
            const [logsData, statsData] = await Promise.all([
                logsApi.list({ date: dateStr }),
                logsApi.stats(),
            ]);
            setLogs(logsData);
            setStats(statsData);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLogs(selectedDateStr);
    }, [selectedDateStr, loadLogs]);

    const handleDateSelect = (dateStr: string) => {
        setSelectedDateStr(dateStr);
    };

    const selectedPill = DATE_PILLS.find(p => p.dateStr === selectedDateStr);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
            <Header title={stats.dateInfo} />

            <main className="flex-1 overflow-y-auto hide-scrollbar max-w-md mx-auto w-full pb-32">
                <SummaryCard
                    coverImage="https://lh3.googleusercontent.com/aida-public/AB6AXuAo8vgvS9AsNPunjyNQU2ACFlxYTiic6BMiK3j0EN7uSXKHbbN0JuhotMlWL5kvH_zqSEF7WTiR5eeEUp9GklWKHSd8AST7XRaLVxkI7uC2Z-gHy2md13_QaJzjpvQ3qxkU16Qf0erk-Ax8eu66CpfjmGfdRNPlAV5Wumq5yj_45O9PpJC-D6WJtlDmeJISntdpQ-vQKkBBx1BuW-ynKtITrCFbTXwHBWSRsf_3nLCULCdv52QTHBJwUMd7vhanJ-90p0vbdA7Iryg"
                    totalActions={stats.totalToday}
                    loading={loading}
                />

                {/* Date pills */}
                <div className="px-4 py-4 flex gap-2 overflow-x-auto hide-scrollbar">
                    {DATE_PILLS.map((pill) => (
                        <button
                            key={pill.dateStr}
                            onClick={() => handleDateSelect(pill.dateStr)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedDateStr === pill.dateStr
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
                        {selectedPill?.label ?? selectedDateStr}
                    </span>
                </div>

                <div className="space-y-1">
                    {loading ? (
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
                                        {selectedDateStr === DATE_PILLS[0].dateStr
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
                                        icon={entry.action?.icon ?? 'task_alt'}
                                        onEdit={() => navigate(`/edit?logId=${entry.log.id}`)}
                                        onDelete={async () => {
                                            if (window.confirm('Delete log?')) {
                                                await logsApi.remove(entry.log.id);
                                                setLogs(prev => prev.filter(l => l.log.id !== entry.log.id));
                                            }
                                        }}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            <BottomNav activeTab="log" showFab />
        </div>
    );
};

export default LogPage;
