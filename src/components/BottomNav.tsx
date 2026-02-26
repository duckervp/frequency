import React from 'react';
import { Link } from 'react-router-dom';

interface BottomNavProps {
    activeTab?: 'dashboard' | 'log' | 'calendar' | 'settings';
    showFab?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
    activeTab = 'dashboard',
    showFab = false,
}) => {
    const tabs = [
        { id: 'dashboard' as const, label: 'Dashboard', icon: 'home', to: '/dashboard' },
        { id: 'log' as const, label: 'Log', icon: 'list_alt', to: '/log' },
        { id: 'calendar' as const, label: 'Calendar', icon: 'calendar_month', to: '/calendar' },
        { id: 'settings' as const, label: 'Settings', icon: 'settings', to: '/settings' },
    ];

    return (
        <>
            {showFab && (
                <div className="fixed bottom-24 right-6 z-30">
                    <Link
                        to="/register"
                        className="bg-primary text-background-dark size-14 rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transform active:scale-90 transition-transform cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold">add</span>
                    </Link>
                </div>
            )}

            <nav className="fixed bottom-0 left-0 right-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-primary/10 pb-6 pt-2">
                <div className="flex px-2 max-w-md mx-auto">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <Link
                                key={tab.id}
                                to={tab.to}
                                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
                            >
                                <span
                                    className="material-symbols-outlined text-[26px]"
                                    style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400" } : {}}
                                >
                                    {tab.icon}
                                </span>
                                <p className="text-[9px] font-bold leading-normal tracking-wide uppercase">{tab.label}</p>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};

export default BottomNav;
