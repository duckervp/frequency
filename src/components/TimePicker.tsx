import React from 'react';

interface TimePickerProps {
    hour: number;       // 1–12
    minute: number;     // 0–59
    period: 'AM' | 'PM';
    onHourChange: (h: number) => void;
    onMinuteChange: (m: number) => void;
    onPeriodChange: (p: 'AM' | 'PM') => void;
}

interface SpinColumnProps {
    label: string;
    value: string;
    onUp: () => void;
    onDown: () => void;
    borderLeft?: boolean;
}

const SpinColumn: React.FC<SpinColumnProps> = ({ label, value, onUp, onDown, borderLeft }) => (
    <div className={`flex-1 flex flex-col items-center gap-1 ${borderLeft ? 'border-l border-slate-200 dark:border-slate-700' : ''}`}>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
        <button
            onClick={onUp}
            className="w-full flex items-center justify-center py-1 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors active:scale-95"
        >
            <span className="material-symbols-outlined text-xl">keyboard_arrow_up</span>
        </button>
        <div className="w-full flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-xl py-3 border border-primary/30">
            <span className="text-slate-900 dark:text-primary text-2xl font-bold tabular-nums">{value}</span>
        </div>
        <button
            onClick={onDown}
            className="w-full flex items-center justify-center py-1 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors active:scale-95"
        >
            <span className="material-symbols-outlined text-xl">keyboard_arrow_down</span>
        </button>
    </div>
);

export const TimePicker: React.FC<TimePickerProps> = ({
    hour, minute, period, onHourChange, onMinuteChange, onPeriodChange,
}) => {
    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <div className="bg-slate-100 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex gap-3 items-stretch">
                <SpinColumn
                    label="Hour"
                    value={pad(hour)}
                    onUp={() => onHourChange(hour === 12 ? 1 : hour + 1)}
                    onDown={() => onHourChange(hour === 1 ? 12 : hour - 1)}
                />
                <div className="flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-2xl pb-1">:</div>
                <SpinColumn
                    label="Min"
                    value={pad(minute)}
                    onUp={() => onMinuteChange(minute === 59 ? 0 : minute + 1)}
                    onDown={() => onMinuteChange(minute === 0 ? 59 : minute - 1)}
                    borderLeft={false}
                />
                <SpinColumn
                    label="Period"
                    value={period}
                    onUp={() => onPeriodChange(period === 'AM' ? 'PM' : 'AM')}
                    onDown={() => onPeriodChange(period === 'AM' ? 'PM' : 'AM')}
                    borderLeft={false}
                />
            </div>
        </div>
    );
};

export default TimePicker;
