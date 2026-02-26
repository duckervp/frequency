import React from 'react';

interface CalendarStatsProps {
    totalThisMonth: number;
    currentStreak: number;
    loading?: boolean;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({
    totalThisMonth, currentStreak, loading,
}) => {
    const streakMessage = currentStreak >= 7
        ? "You're on fire! 🔥 Keep it up!"
        : currentStreak >= 3
            ? "Great consistency! Keep going!"
            : currentStreak >= 1
                ? "Good start! Build your streak!"
                : "Log an action today to start your streak!";

    return (
        <>
            <section className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-primary/70 uppercase tracking-wider mb-1">
                        Total this month
                    </p>
                    <div className="flex items-end gap-2">
                        {loading ? (
                            <span className="h-9 w-12 skeleton my-0.5" />
                        ) : (
                            <span className="text-3xl font-bold animate-fade-in">{totalThisMonth}</span>
                        )}
                        <span className="text-sm font-medium text-slate-400 mb-1">
                            {totalThisMonth === 1 ? 'log' : 'logs'}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-primary/70 uppercase tracking-wider mb-1">
                        Current Streak
                    </p>
                    <div className="flex items-end gap-2">
                        {loading ? (
                            <span className="h-9 w-12 skeleton my-0.5" />
                        ) : (
                            <span className="text-3xl font-bold animate-fade-in">{currentStreak}</span>
                        )}
                        <span className="text-sm font-medium text-slate-400 mb-1">
                            {currentStreak === 1 ? 'day' : 'days'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="size-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-background-dark">
                        {currentStreak >= 3 ? 'trending_up' : 'track_changes'}
                    </span>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                        {currentStreak >= 7 ? 'On a Roll!' : currentStreak >= 3 ? 'Doing Great!' : 'Keep Going!'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{streakMessage}</p>
                </div>
            </section>
        </>
    );
};

export default CalendarStats;
