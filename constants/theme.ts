export const colors = {
  bg: '#000000',
  bgElevated: '#000000',
  bgCard: '#000000',
  surface: '#000000',
  surfaceHover: '#000000',
  border: 'rgba(255,255,255,0.10)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderGlow: 'rgba(217,93,26,0.4)',

  text: '#FFFFFF',
  textMuted: '#999999',
  textDim: '#666666',

  icon: '#999999',
  iconMuted: '#666666',
  iconActive: '#D95D1A',

  accent: '#D95D1A',
  accentSoft: 'rgba(217,93,26,0.12)',
  violet: '#D95D1A',
  violetDeep: '#A8430F',
  teal: '#D95D1A',
  tealDeep: '#A8430F',
  amber: '#E08A4D',
  rose: '#FF4444',
  emerald: '#22C55E',

  gradientStart: '#D95D1A',
  gradientMid: '#E08A4D',
  gradientEnd: '#C2410C',

  lock: '#D95D1A',
  danger: '#FF4444',
  success: '#22C55E',
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
