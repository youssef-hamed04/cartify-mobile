// Design tokens from the Cartify Mobile App Figma file (variables + recurring values)
export const colors = {
  ink: '#0f172a',
  body: '#475569',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f7f8f9',
  white: '#ffffff',
  navy: '#02067e',
  navyDeep: '#01034f',
  indigo: '#5c61ff',
  indigoBright: '#4448f5',
  periwinkle: '#9da7ff',
  lavender: '#ecedff',
  coral: '#ff6b6b',
  success: '#16a34a',
  successBg: '#dcfce7',
  warning: '#b45309',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  star: '#f59e0b',
} as const;

// Hero gradient: linear-gradient(142deg, #01034f 0%, #02067e 36%, #4448f5 71%)
export const heroGradient = {
  colors: [colors.navyDeep, colors.navy, colors.indigoBright] as const,
  locations: [0, 0.357, 0.714] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0.8 },
};

export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

export type FontWeight = keyof typeof fonts;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  sheet: 36,
  input: 28,
  pill: 9999,
} as const;

export const spacing = {
  screen: 24, // horizontal screen gutter
  sheet: 28,
  tabBar: 120, // bottom padding for tab screens so content clears the floating nav
} as const;

// Soft navy shadows used across cards and primary buttons
export const shadows = {
  button: {
    shadowColor: colors.navy,
    shadowOpacity: 0.3,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  card: {
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sheet: {
    shadowColor: colors.navy,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
} as const;
