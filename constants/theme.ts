export const colors = {
  bg: '#000000',
  bgElevated: 'rgba(255,255,255,0.04)',
  bgCard: 'rgba(255,255,255,0.07)',
  surface: 'rgba(255,255,255,0.08)',
  surfaceHover: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.16)',
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderGlow: 'rgba(217,93,26,0.5)',

  text: '#FFFFFF',
  textMuted: '#C4C4CE',
  textDim: '#8E8E99',

  icon: '#C4C4CE',
  iconMuted: '#8E8E99',
  iconActive: '#D95D1A',

  accent: '#D95D1A',
  accentSoft: 'rgba(217,93,26,0.18)',
  violet: '#D95D1A',
  violetDeep: '#A8430F',
  teal: '#4C8DFF',
  tealDeep: '#2F6FE0',
  amber: '#E08A4D',
  rose: '#FF5A5A',
  emerald: '#3DDC84',

  gradientStart: '#D95D1A',
  gradientMid: '#E08A4D',
  gradientEnd: '#C2410C',

  lock: '#D95D1A',
  danger: '#FF5A5A',
  success: '#3DDC84',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const typography = {
  hero: 42,
  h1: 32,
  h2: 24,
  h3: 18,
  body: 16,
  small: 14,
  caption: 12,
} as const;
