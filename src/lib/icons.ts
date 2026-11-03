// Every Material Symbol the app can render. The icon font is requested with exactly this list
// (vite.config.ts writes it into index.html), so a name missing here shows up as text.

/** Icons offered when creating an action on web */
export const ACTION_ICONS = [
    'book', 'directions_run', 'self_improvement', 'code', 'bedtime',
    'water_drop', 'restaurant', 'fitness_center', 'pill', 'menu_book',
];

/** Icons the mobile app offers for actions (it stores them with '-', see actionIcon) */
const MOBILE_ACTION_ICONS = [
    'fitness_center', 'restaurant', 'water_drop', 'medication', 'self_improvement',
    'menu_book', 'music_note', 'code', 'work', 'directions_walk',
    'star', 'favorite', 'emoji_people', 'local_cafe', 'bedtime',
];

/** Icons used directly by pages and components */
const UI_ICONS = [
    'add', 'analytics', 'apps', 'arrow_back_ios_new', 'calendar_month', 'check', 'check_circle',
    'chevron_left', 'chevron_right', 'close', 'delete', 'edit', 'error', 'event_busy', 'expand_more',
    'help', 'history', 'home', 'info', 'keyboard_arrow_down', 'keyboard_arrow_up', 'list_alt', 'lock',
    'mail', 'more_horiz', 'notes', 'notifications', 'palette', 'person', 'save', 'schedule', 'search',
    'security', 'sentiment_neutral', 'settings', 'task_alt', 'track_changes', 'trending_up', 'tune',
];

/** Sorted A-Z, as the Google Fonts icon_names parameter requires */
export const ALL_ICONS = [...new Set([...UI_ICONS, ...ACTION_ICONS, ...MOBILE_ACTION_ICONS])].sort();

const FALLBACK_ICON = 'task_alt';

/** Glyph for an icon stored on an action: mobile stores 'water-drop', and an unknown name gets a neutral icon instead of text */
export function actionIcon(name: string | null | undefined): string {
    const glyph = (name ?? '').replace(/-/g, '_');
    return ALL_ICONS.includes(glyph) ? glyph : FALLBACK_ICON;
}
