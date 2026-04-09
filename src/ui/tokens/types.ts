/** Raw hex color string, e.g. "#1a1a2e" */
export type HexColor = `#${string}`

/** All color roles in the design system */
export interface ColorTokens {
  // Backgrounds
  background: HexColor
  surface: HexColor
  surfaceAlt: HexColor
  overlay: HexColor

  // Text
  text: HexColor
  textMuted: HexColor
  textInverse: HexColor

  // Brand / accent
  primary: HexColor
  primaryForeground: HexColor
  secondary: HexColor
  secondaryForeground: HexColor
  accent: HexColor
  accentForeground: HexColor

  // Semantic
  success: HexColor
  successForeground: HexColor
  warning: HexColor
  warningForeground: HexColor
  error: HexColor
  errorForeground: HexColor
  info: HexColor
  infoForeground: HexColor

  // Borders / dividers
  border: HexColor
  borderFocus: HexColor
  divider: HexColor

  // Interactive
  inputBackground: HexColor
  inputBorder: HexColor
  inputText: HexColor
  inputPlaceholder: HexColor

  // Destructive
  destructive: HexColor
  destructiveForeground: HexColor

  // Badges / tags
  badgeBackground: HexColor
  badgeForeground: HexColor
}

/** Spacing scale in logical pixels */
export interface SpacingTokens {
  0: number   // 0
  1: number   // 4
  2: number   // 8
  3: number   // 12
  4: number   // 16
  5: number   // 20
  6: number   // 24
  8: number   // 32
  10: number  // 40
  12: number  // 48
  16: number  // 64
  20: number  // 80
}

/** Border radius scale in logical pixels */
export interface RadiusTokens {
  none: number   // 0
  sm: number     // 4
  md: number     // 8
  lg: number     // 12
  xl: number     // 16
  '2xl': number  // 24
  full: number   // 9999
}

/** Typography scale */
export interface TypographyTokens {
  fontSizeXs: number    // 11
  fontSizeSm: number    // 13
  fontSizeMd: number    // 15
  fontSizeLg: number    // 17
  fontSizeXl: number    // 20
  fontSize2xl: number   // 24
  fontSize3xl: number   // 30
  fontSize4xl: number   // 36
  lineHeightTight: number    // 1.2
  lineHeightNormal: number   // 1.5
  lineHeightRelaxed: number  // 1.75
  fontWeightRegular: '400'
  fontWeightMedium: '500'
  fontWeightSemibold: '600'
  fontWeightBold: '700'
}

/** Shadow definition for React Native */
export interface ShadowToken {
  shadowColor: HexColor
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number  // Android
}

export interface ShadowTokens {
  none: ShadowToken
  sm: ShadowToken
  md: ShadowToken
  lg: ShadowToken
  xl: ShadowToken
}

/** Full resolved token set */
export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  radius: RadiusTokens
  typography: TypographyTokens
  shadows: ShadowTokens
}

/** A flavor defines light and dark color token sets */
export interface TokenFlavor {
  name: string
  light: ColorTokens
  dark: ColorTokens
}

/** Config accepted by resolveTokens() */
export interface TokenConfig {
  flavor?: string
  colorScheme?: 'light' | 'dark' | 'system'
  overrides?: DeepPartial<DesignTokens>
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
