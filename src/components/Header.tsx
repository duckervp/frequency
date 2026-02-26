import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    title: string;
    backLabel?: string;
    backTo?: string;
    onMorePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, backLabel, backTo, onMorePress }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (backTo) {
            navigate(backTo);
        } else {
            navigate(-1);
        }
    };

    return (
        <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
            <div className="flex items-center p-4 justify-between max-w-md mx-auto w-full">
                {backLabel !== undefined ? (
                    <button
                        onClick={handleBack}
                        className="text-primary flex items-center gap-1 -ml-2 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[22px] font-semibold">arrow_back_ios_new</span>
                        {backLabel && <span className="text-[17px] font-medium">{backLabel}</span>}
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
                    {title}
                </h1>

                <button
                    onClick={onMorePress}
                    className="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                >
                    <span className="material-symbols-outlined">more_horiz</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
