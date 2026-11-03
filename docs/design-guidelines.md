# Frequency — Design Guidelines

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#2bee79` | Buttons, active states, icons, accents |
| `background-dark` | `#102217` | Dark mode background |
| `background-light` | `#f6f8f7` | Light mode background |
| Slate-100 | `#f1f5f9` | Light surfaces (cards, inputs) |
| Slate-800 | `#1e293b` | Dark surfaces |
| Slate-400 | `#94a3b8` | Muted text / secondary text |
| Red-500 | `#ef4444` | Destructive actions (delete, logout) |

### Primary Opacity Scale (used for tints)
- `primary/5` — very subtle background wash
- `primary/10` — badge background, icon bg
- `primary/20` — hover/active state, borders
- `primary/40` — shadow color for primary buttons

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Brand | Lexend | 700 | 4xl (title), 2xl (section) |
| Section headers | Lexend | 600 | lg–xl |
| Body / labels | Lexend | 400–500 | sm–base |
| Micro labels | Lexend | 700 | 9px uppercase tracking-wide (tab labels) |
| Error text | Lexend | 400 | sm, red-400 |

## Component Patterns

### Buttons

**Primary CTA** (e.g., Sign In, Create):
```
bg-primary text-background-dark rounded-xl h-14 px-5 font-bold
active:scale-95 transition-transform shadow-md
```

**Secondary / Dark** (e.g., Continue with Google):
```
bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900
rounded-xl h-14 px-5 font-bold active:scale-95
```

**Ghost / Text link**:
```
text-slate-500 text-sm font-semibold hover:text-primary transition-colors
```

**Destructive** (Logout):
```
bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20
rounded-xl py-4 font-bold
```

### Input Fields
```
w-full h-12 px-4 rounded-xl
bg-slate-100 dark:bg-slate-800/50
border border-transparent
focus:border-primary/50 focus:ring-2 focus:ring-primary/20
outline-none text-sm
```

### Cards / Surfaces
```
rounded-xl bg-slate-200/50 dark:bg-slate-800/50
border border-transparent
```

### Settings Row
```
flex items-center gap-4 bg-white dark:bg-primary/5
px-4 py-3 rounded-lg border-b border-slate-100 dark:border-primary/5
hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors
```

## Icons

**Web:** Material Symbols Outlined (Google font)
```html
<span class="material-symbols-outlined">icon_name</span>
```

**Mobile (React Native):** `@expo/vector-icons` — `MaterialIcons` or `MaterialCommunityIcons`
```tsx
import { MaterialIcons } from '@expo/vector-icons';
<MaterialIcons name="home" size={26} color={color} />
```

### Key Icon Mapping

| Purpose | Material Symbol (web) | MaterialIcons (mobile) |
|---|---|---|
| Dashboard / Home | `home` | `home` |
| Log | `list_alt` | `list-alt` |
| Calendar | `calendar_month` | `calendar-month` |
| Settings | `settings` | `settings` |
| Add / FAB | `add` | `add` |
| Analytics (brand) | `analytics` | `analytics` |
| Search | `search` | `search` |
| Back | `arrow_back_ios_new` | `arrow-back-ios` |
| Edit | `edit` | `edit` |
| Delete | `delete` | `delete` |
| Person | `person` | `person` |

## Animation Conventions

| Effect | CSS | RN Equivalent |
|---|---|---|
| Fade in on load | `animate-fade-in` (0.4s ease-out + translateY 4px) | `react-native-reanimated` `FadeInDown` |
| Skeleton pulse | `animate-skeleton` (1.5s opacity pulse) | `Animated.loop` opacity |
| Button press | `active:scale-95` | `Pressable` with `scale(0.95)` via Reanimated |
| Haptic feedback | N/A (web) | `expo-haptics` `impactAsync(Light)` on press |

## Layout Principles

- **Max width constraint:** `max-w-md mx-auto` — content never wider than ~448px (phone width)
- **Bottom padding for nav:** `pb-32` to clear fixed bottom tab bar
- **Safe areas:** Use `SafeAreaView` / `useSafeAreaInsets` on mobile for notch/home indicator
- **Sticky header:** `sticky top-0 z-10` with `backdrop-blur-md` and `bg-*/80` opacity
- **Scrollable content:** `overflow-y-auto hide-scrollbar` (web) → `ScrollView` with hidden scrollbar (mobile)

## Dark Mode

Dark mode is always active (`class="dark"` on root `<div>`). All Tailwind dark: variants should be included.

The app default is **dark mode only** on mobile (matches `#102217` background). No light/dark toggle is currently implemented.

## Skeleton Loading

Skeleton elements use:
```
.skeleton { animate-skeleton bg-slate-200 dark:bg-slate-800 rounded }
```

Common skeleton dimensions:
- Icon placeholder: `size-10 rounded-full`
- Title line: `h-4 w-32`
- Subtitle line: `h-3 w-16`
- Card: `min-h-[52px] rounded-xl`
