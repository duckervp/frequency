import React from 'react';
import { actionIcon } from '../lib/icons';
import { actionTile } from '../lib/colors';

interface ActionIconProps {
    icon: string | null | undefined;
    color: string | null | undefined;
    /** Size and shape, e.g. "size-10 rounded-lg" */
    className?: string;
    iconClassName?: string;
}

/** An action's icon on a tile in the action's color; used wherever an action is shown */
export const ActionIcon: React.FC<ActionIconProps> = ({ icon, color, className = 'size-10 rounded-lg', iconClassName = '' }) => (
    <div data-action-color={color ?? ''} className={`flex shrink-0 items-center justify-center ${actionTile(color)} ${className}`}>
        <span className={`material-symbols-outlined ${iconClassName}`}>{actionIcon(icon)}</span>
    </div>
);

export default ActionIcon;
