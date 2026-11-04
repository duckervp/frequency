// Action colors are stored as a swatch class ('bg-blue-400'). Tailwind only generates classes it
// finds written out in the source, so every tint used to draw an action is listed here in full.

/** Colors offered when creating an action on web */
export const ACTION_COLORS = [
    'bg-primary', 'bg-blue-400', 'bg-purple-400',
    'bg-orange-400', 'bg-pink-400', 'bg-yellow-400',
];

/** Tile classes (soft background + matching icon color) for every stored color, web and mobile */
const TILES: Record<string, string> = {
    'bg-primary': 'bg-primary/20 text-primary',
    'bg-blue-400': 'bg-blue-400/20 text-blue-400',
    'bg-purple-400': 'bg-purple-400/20 text-purple-400',
    'bg-orange-400': 'bg-orange-400/20 text-orange-400',
    'bg-pink-400': 'bg-pink-400/20 text-pink-400',
    'bg-yellow-400': 'bg-yellow-400/20 text-yellow-500',
    // Offered by the mobile app
    'bg-blue-500': 'bg-blue-500/20 text-blue-500',
    'bg-purple-500': 'bg-purple-500/20 text-purple-500',
    'bg-orange-500': 'bg-orange-500/20 text-orange-500',
    'bg-pink-500': 'bg-pink-500/20 text-pink-500',
    'bg-teal-500': 'bg-teal-500/20 text-teal-500',
    'bg-cyan-500': 'bg-cyan-500/20 text-cyan-500',
    'bg-red-500': 'bg-red-500/20 text-red-500',
};

/** Classes for an action's icon tile; an unknown color falls back to the app color */
export function actionTile(color: string | null | undefined): string {
    return TILES[color ?? ''] ?? TILES['bg-primary'];
}
