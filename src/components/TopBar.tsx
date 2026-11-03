import React from 'react';

interface TopBarProps {
    title: React.ReactNode;
    left?: React.ReactNode;
    right?: React.ReactNode;
}

/** The one top bar used by every page; the title stays centered whatever the sides hold */
export const TopBar: React.FC<TopBarProps> = ({ title, left, right }) => (
    <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-primary/10">
        <div className="grid grid-cols-[minmax(2.5rem,1fr)_auto_minmax(2.5rem,1fr)] items-center gap-2 p-4">
            <div className="flex items-center justify-start">{left}</div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-center">{title}</h1>
            <div className="flex items-center justify-end">{right}</div>
        </div>
    </header>
);

interface TopBarButtonProps {
    icon: string;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

export const TopBarButton: React.FC<TopBarButtonProps> = ({ icon, label, onClick, disabled, className = '' }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={`flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors disabled:opacity-50 ${className}`}
    >
        <span className="material-symbols-outlined">{icon}</span>
    </button>
);

export default TopBar;
