import React from 'react';

interface SummaryCardProps {
    coverImage: string;
    totalActions: number;
    loading?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    coverImage,
    totalActions,
    loading
}) => {
    return (
        <div className="p-4 @container">
            <div className="flex flex-col items-stretch justify-start rounded-xl @xl:flex-row @xl:items-start shadow-lg bg-white dark:bg-primary/5 border border-primary/10 overflow-hidden">
                <div
                    className="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover relative"
                    style={{ backgroundImage: `url("${coverImage}")` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark/60 to-transparent"></div>
                </div>
                <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-1 py-5 px-5">
                    <p className="text-primary text-xs font-semibold uppercase tracking-wider">Daily Summary</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">Total actions today</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary material-symbols-outlined text-xl">check_circle</span>
                        {loading ? (
                            <div className="h-5 w-32 skeleton" />
                        ) : (
                            <p className="text-slate-600 dark:text-slate-400 text-base font-medium animate-fade-in">{totalActions} actions completed</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryCard;
