import React from 'react';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

/** Inline error for a failed load or action, with an optional retry */
export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-6 text-center">
        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        {onRetry && (
            <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:bg-primary/90"
            >
                Try again
            </button>
        )}
    </div>
);

export default ErrorState;
