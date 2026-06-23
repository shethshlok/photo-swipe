/**
 * Design tokens for the app, translating Apple's HIG (Clarity / Deference / Depth)
 * into React Native primitives:
 *  - semantic light/dark palettes that adapt automatically
 *  - an iOS type ramp (largeTitle … caption)
 *  - consistent spacing, radii and subtle card shadows (radius 8, y 4, low opacity)
 */
import { Platform, TextStyle } from 'react-native';

export type Palette = {
  scheme: 'light' | 'dark';
  // Surfaces
  bg: string;
  bgGrouped: string;
  card: string;
  cardElevated: string;
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  onAccent: string;
  // Lines + accents
  separator: string;
  tint: string;
  keep: string;
  delete: string;
  // Image scrims
  scrim: string;
  shadow: string;
};

export const Colors: { light: Palette; dark: Palette } = {
  light: {
    scheme: 'light',
    bg: '#FFFFFF',
    bgGrouped: '#F2F2F7',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    text: '#000000',
    textSecondary: 'rgba(60,60,67,0.6)',
    textTertiary: 'rgba(60,60,67,0.3)',
    onAccent: '#FFFFFF',
    separator: 'rgba(60,60,67,0.18)',
    tint: '#007AFF',
    keep: '#34C759',
    delete: '#FF3B30',
    scrim: 'rgba(0,0,0,0.45)',
    shadow: '#000000',
  },
  dark: {
    scheme: 'dark',
    bg: '#000000',
    bgGrouped: '#000000',
    card: '#1C1C1E',
    cardElevated: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: 'rgba(235,235,245,0.6)',
    textTertiary: 'rgba(235,235,245,0.3)',
    onAccent: '#FFFFFF',
    separator: 'rgba(84,84,88,0.65)',
    tint: '#0A84FF',
    keep: '#30D158',
    delete: '#FF453A',
    scrim: 'rgba(0,0,0,0.55)',
    shadow: '#000000',
  },
};

/** System font families. Rounded design adds personality to titles & numerals. */
export const FontFamily = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  default: { sans: 'System', rounded: 'System' },
})!;

/** Apple-style type ramp. */
export const Type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.43 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.43 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} satisfies Record<string, TextStyle>;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Subtle elevation per the design guidance (radius 8, y 4, low opacity). */
export const cardShadow = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
});
