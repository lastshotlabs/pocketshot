import type {
  SpacingTokens,
  RadiusTokens,
  TypographyTokens,
  ShadowTokens,
  AnimationTokens,
  OpacityTokens,
  ZIndexTokens,
} from './types'

export const defaultSpacing: SpacingTokens = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
}

export const defaultRadius: RadiusTokens = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
}

export const defaultTypography: TypographyTokens = {
  fontSizeXs: 11,
  fontSizeSm: 13,
  fontSizeMd: 15,
  fontSizeLg: 17,
  fontSizeXl: 20,
  fontSize2xl: 24,
  fontSize3xl: 30,
  fontSize4xl: 36,
  fontSize5xl: 48,
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
}

export const defaultAnimation: AnimationTokens = {
  durationFast: 100,
  durationNormal: 250,
  durationSlow: 400,
  durationVSlow: 800,
  easingDefault: 'default',
  easingSpring: 'spring',
  easingEaseOut: 'ease-out',
  easingEaseInOut: 'ease-in-out',
}

export const defaultOpacity: OpacityTokens = {
  transparent: 0,
  subtle: 0.08,
  light: 0.16,
  medium: 0.38,
  heavy: 0.62,
  opaque: 0.87,
  full: 1,
}

export const defaultZIndex: ZIndexTokens = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
}

export const defaultShadows: ShadowTokens = {
  none: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
}
