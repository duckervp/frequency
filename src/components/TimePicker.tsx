import React, { useEffect, useRef, useState } from 'react';

interface TimePickerProps {
    value: string; // "HH:mm", 24h; shown as 12h with AM/PM
    onChange: (value: string) => void;
}

type Period = 'AM' | 'PM';

const pad = (n: number) => String(n).padStart(2, '0');

const wrap = (n: number, min: number, max: number) => {
    const size = max - min + 1;
    return ((n - min) % size + size) % size + min;
};

/**
 * Steps once per click and keeps stepping while the button is held. A press only steps on
 * its own after 400ms, so a touch that turns into a page scroll (pointercancel) changes nothing.
 */
function useHoldRepeat(step: () => void) {
    const stepRef = useRef(step);
    const timer = useRef<number | undefined>(undefined);
    const repeated = useRef(false);
    useEffect(() => { stepRef.current = step; });
    useEffect(() => () => clearTimeout(timer.current), []);

    const repeat = (delay: number) => {
        timer.current = window.setTimeout(() => {
            repeated.current = true;
            stepRef.current();
            repeat(80);
        }, delay);
    };
    const stop = () => clearTimeout(timer.current);

    return {
        onPointerDown: (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            repeated.current = false;
            repeat(400);
        },
        onPointerUp: stop,
        onPointerLeave: stop,
        onPointerCancel: stop,
        onClick: () => {
            if (!repeated.current) stepRef.current();
            repeated.current = false;
        },
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
}

// Arrow buttons are for pointers; keyboard users step with the spinbutton's arrow keys
const arrowClass = 'w-full flex items-center justify-center py-1 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors active:scale-95 select-none touch-manipulation [-webkit-touch-callout:none]';

interface NumberFieldProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (n: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({ label, value, min, max, onChange }) => {
    // Raw text while typing; an out-of-range entry is never committed and reverts on blur
    const [draft, setDraft] = useState<string | null>(null);
    const step = (delta: number) => {
        setDraft(null);
        onChange(wrap(value + delta, min, max));
    };
    const up = useHoldRepeat(() => step(1));
    const down = useHoldRepeat(() => step(-1));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            step(e.key === 'ArrowUp' ? 1 : -1);
        } else if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
            <button type="button" tabIndex={-1} aria-label={`Increase ${label.toLowerCase()}`} className={arrowClass} {...up}>
                <span className="material-symbols-outlined text-xl">keyboard_arrow_up</span>
            </button>
            <input
                role="spinbutton"
                aria-label={label}
                aria-valuenow={value}
                aria-valuemin={min}
                aria-valuemax={max}
                inputMode="numeric"
                value={draft ?? pad(value)}
                onFocus={(e) => {
                    const el = e.target;
                    const before = el.value;
                    el.select();
                    // iOS Safari ignores select() during focus; retry next frame unless typing started
                    requestAnimationFrame(() => {
                        if (document.activeElement === el && el.value === before) el.select();
                    });
                }}
                onChange={(e) => {
                    // A digit typed into a full field (caret not replacing it) starts a new number
                    const raw = e.target.value;
                    if (!/^\d*$/.test(raw)) return;
                    const caret = e.target.selectionStart ?? raw.length;
                    const text = raw.length > 2 ? raw[caret - 1] : raw;
                    setDraft(text);
                    const n = Number(text);
                    if (text && n >= min && n <= max) onChange(n);
                }}
                onBlur={() => setDraft(null)}
                onKeyDown={handleKeyDown}
                className="w-full text-center bg-primary/10 dark:bg-primary/20 rounded-xl py-3 border border-primary/30 text-slate-900 dark:text-primary text-2xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button type="button" tabIndex={-1} aria-label={`Decrease ${label.toLowerCase()}`} className={arrowClass} {...down}>
                <span className="material-symbols-outlined text-xl">keyboard_arrow_down</span>
            </button>
        </div>
    );
};

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const [hours, minute] = value.split(':').map(Number);
    const hour = hours % 12 || 12;
    const period: Period = hours < 12 ? 'AM' : 'PM';
    const set = (h: number, m: number, p: Period) => onChange(`${pad((h % 12) + (p === 'PM' ? 12 : 0))}:${pad(m)}`);

    return (
        <div className="bg-slate-100 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex gap-3 items-stretch">
                <NumberField label="Hour" value={hour} min={1} max={12} onChange={(h) => set(h, minute, period)} />
                <div className="flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-2xl pt-4">:</div>
                <NumberField label="Minute" value={minute} min={0} max={59} onChange={(m) => set(hour, m, period)} />
                <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Period</span>
                    <div className="w-full flex-1 flex flex-col gap-2 justify-center">
                        {(['AM', 'PM'] as const).map(p => (
                            <button
                                key={p}
                                type="button"
                                aria-pressed={period === p}
                                onClick={() => set(hour, minute, p)}
                                className={`w-full rounded-xl py-2 text-base font-bold transition-colors ${period === p
                                    ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30 text-slate-900 dark:text-primary'
                                    : 'border border-transparent text-slate-400 hover:bg-primary/10 hover:text-primary'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimePicker;
