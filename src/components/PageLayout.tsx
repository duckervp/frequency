import React from 'react';

interface PageLayoutProps {
    /** Usually a <TopBar />; it stays at the top while the window scrolls */
    header: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Shell shared by every signed-in page: background, centered max-w-md column, sticky top bar.
 * The column must not get an overflow class: that makes it a scroll container and the
 * sticky top bar would scroll away with the page.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({ header, children }) => (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display">
        <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col">
            {header}
            {children}
        </div>
    </div>
);

export default PageLayout;
