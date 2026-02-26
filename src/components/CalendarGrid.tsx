import React from 'react';

interface CalendarGridProps {
    year: number;
    month: number; // 0-indexed (0 = Jan)
    activeDays: Set<number>; // day-of-month numbers that have logs
    selectedDay: number | null;
    onDaySelect: (day: number) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    year, month, activeDays, selectedDay, onDaySelect, onPrevMonth, onNextMonth,
}) => {
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDay = isCurrentMonth ? today.getDate() : -1;

    // Day of week the 1st falls on (0=Sun)
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array(firstDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <section className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onPrevMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-primary/10 rounded-lg transition-colors"
                    aria-label="Previous month"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h3 className="text-base font-bold">
                    {MONTH_NAMES[month]} {year}
                </h3>
                <button
                    onClick={onNextMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-primary/10 rounded-lg transition-colors"
                    aria-label="Next month"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            <div className="grid grid-cols-7 text-center mb-2">
                {DAY_LABELS.map(d => (
                    <span key={d} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {d}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, idx) => {
                    if (day === null) {
                        return <div key={`empty-${idx}`} className="h-12" />;
                    }

                    const isToday = day === todayDay;
                    const isSelected = day === selectedDay;
                    const hasLogs = activeDays.has(day);

                    if (isSelected) {
                        return (
                            <button
                                key={day}
                                onClick={() => onDaySelect(day)}
                                className="relative h-12 w-full flex items-center justify-center text-sm font-medium"
                            >
                                <div className="absolute inset-0 m-1 bg-primary rounded-full" />
                                <span className="relative text-background-dark font-bold">{day}</span>
                            </button>
                        );
                    }

                    if (hasLogs) {
                        return (
                            <button
                                key={day}
                                onClick={() => onDaySelect(day)}
                                className="relative h-12 w-full flex items-center justify-center text-sm font-medium"
                            >
                                <div className={`absolute inset-0 m-1 rounded-full ${isToday ? 'bg-primary/40' : 'bg-primary/20 dark:bg-primary/30'}`} />
                                <span className="relative">{day}</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={day}
                            onClick={() => onDaySelect(day)}
                            className={`relative h-12 w-full flex items-center justify-center text-sm font-medium rounded-full transition-colors hover:bg-slate-50 dark:hover:bg-primary/5 ${isToday ? 'ring-2 ring-primary/40 ring-inset rounded-full' : ''}`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default CalendarGrid;
