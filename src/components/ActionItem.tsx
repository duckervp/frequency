import React from 'react';
import ActionIcon from './ActionIcon';

interface ActionItemProps {
    title: string;
    time: string;
    note: string;
    category: string;
    icon: string | null | undefined;
    color: string | null | undefined;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const ActionItem: React.FC<ActionItemProps> = ({
    title,
    time,
    note,
    category,
    icon,
    color,
    onEdit,
    onDelete
}) => {
    return (
        <div className="flex gap-4 bg-transparent hover:bg-primary/5 px-4 py-4 items-start border-b border-primary/5 transition-colors group">
            <ActionIcon icon={icon} color={color} className="size-12 rounded-xl" />
            <div className="flex flex-1 flex-col justify-center">
                <div className="flex justify-between items-start w-full">
                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">{title}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium uppercase">{time}</p>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-relaxed italic pr-12">{note}</p>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-primary/70 text-xs font-medium">{category}</p>
                    <div className="flex gap-3 text-slate-400 dark:text-slate-500">
                        <button
                            onClick={onEdit}
                            className="hover:text-primary transition-colors flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                            onClick={onDelete}
                            className="hover:text-red-400 transition-colors flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionItem;
