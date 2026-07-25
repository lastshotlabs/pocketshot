import type {
  FontConfig as ContractFontConfig,
  GlobalTokens as ContractGlobalTokens,
  RadiusScale as ContractRadiusScale,
  ThemeColors as ContractThemeColors,
  ThemeConfig,
} from '@lastshotlabs/frontend-contract/tokens'

import { darken, lighten, mix } from './color'
import { flavorNames } from './flavors'
import {
  defaultAnimation,
  defaultOpacity,
  defaultRadius,
  defaultSpacing,
  defaultTypography,
} from './schema'
import { resolveTokens as resolveLocalTokens } from './resolve'
import type {
  AnimationTokens,
  ColorTokens,
  DeepPartial,
  DesignTokens,
  HexColor,
  RadiusTokens,
  SpacingTokens,
  TokenConfig,
  TypographyTokens,
} from './types'

type ContractThemeFragment = {
  colors?: ContractThemeColors
  darkColors?: ContractThemeColors
  radius?: ContractRadiusScale
  spacing?: 'compact' | 'default' | 'comfortable' | 'spacious'
  font?: ContractFontConfig
  tokens?: ContractGlobalTokens
}

const LOCAL_FLAVOR_NAMES = new Set<string>(flavorNames)

const LIGHT_FG = '#111827' as HexColor
const DARK_FG = '#ffffff' as HexColor

const RADIUS_PRESETS: Record<ContractRadiusScale, RadiusTokens> = {
  none: { none: 0, sm: 0, md: 0, lg: 0, xl: 0, '2xl': 0, full: 9999 },
  xs: { none: 0, sm: 2, md: 4, lg: 6, xl: 8, '2xl': 12, full: 9999 },
  sm: { none: 0, sm: 4, md: 6, lg: 8, xl: 10, '2xl': 14, full: 9999 },
  md: defaultRadius,
  lg: { none: 0, sm: 5, md: 10, lg: 14, xl: 18, '2xl': 24, full: 9999 },
  xl: { none: 0, sm: 6, md: 12, lg: 16, xl: 20, '2xl': 28, full: 9999 },
  full: { none: 0, sm: 9999, md: 9999, lg: 9999, xl: 9999, '2xl': 9999, full: 9999 },
}

const SPACING_FACTORS: Record<NonNullable<ContractThemeFragment['spacing']>, number> = {
  compact: 0.875,
  default: 1,
  comfortable: 1.125,
  spacious: 1.25,
}

function deepMerge<T extends object>(base: T, overrides: DeepPartial<T>): T {
  const result = { ...base }
  for (const key in overrides) {
    const overrideVal = overrides[key]
    if (
      overrideVal !== undefined &&
      overrideVal !== null &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal)
    ) {
      result[key] = deepMerge(
        (base[key] as object) ?? {},
        overrideVal as DeepPartial<object>,
      ) as T[typeof key]
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[typeof key]
    }
  }
  return result
}

function isBlendableHexColor(value: string | undefined): value is HexColor {
  return value != null && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

function toHexColor(value: string | undefined): HexColor | undefined {
  return isBlendableHexColor(value) ? value : undefined
}

function getForegroundColor(background: HexColor): HexColor {
  const full =
    background.length === 4
      ? `#${background[1]}${background[1]}${background[2]}${background[2]}${background[3]}${background[3]}`
      : background
  const r = parseInt(full.slice(1, 3), 16)
  const g = parseInt(full.slice(3, 5), 16)
  const b = parseInt(full.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? LIGHT_FG : DARK_FG
}

function shiftSurface(color: HexColor, scheme: 'light' | 'dark', amount: number): HexColor {
  return scheme === 'dark' ? lighten(color, amount) : darken(color, amount)
}

function mapThemeColorsToNative(
  colors: ContractThemeColors | undefined,
  scheme: 'light' | 'dark',
  baseColors: ColorTokens,
): DeepPartial<ColorTokens> {
  if (!colors) {
    return {}
  }

  const next: DeepPartial<ColorTokens> = {}

  const background = toHexColor(colors.background)
  const surface = toHexColor(colors.card) ?? toHexColor(colors.popover)
  const primary = toHexColor(colors.primary)
  const secondary = toHexColor(colors.secondary)
  const accent = toHexColor(colors.accent)
  const success = toHexColor(colors.success)
  const warning = toHexColor(colors.warning)
  const info = toHexColor(colors.info)
  const destructive = toHexColor(colors.destructive)
  const muted = toHexColor(colors.muted)
  const border = toHexColor(colors.border)
  const ring = toHexColor(colors.ring)
  const input = toHexColor(colors.input)

  if (background) {
    next.background = background
    next.text = getForegroundColor(background)
    next.textInverse = baseColors.background
    next.overlay = scheme === 'dark' ? '#00000099' : '#00000066'
  }

  if (surface) {
    next.surface = surface
    next.surfaceAlt = shiftSurface(surface, scheme, 0.08)
  }

  if (primary) {
    next.primary = primary
    next.primaryForeground = getForegroundColor(primary)
  }

  if (secondary) {
    next.secondary = secondary
    next.secondaryForeground = getForegroundColor(secondary)
  }

  if (accent) {
    next.accent = accent
    next.accentForeground = getForegroundColor(accent)
  }

  if (success) {
    next.success = success
    next.successForeground = getForegroundColor(success)
  }

  if (warning) {
    next.warning = warning
    next.warningForeground = getForegroundColor(warning)
  }

  if (info) {
    next.info = info
    next.infoForeground = getForegroundColor(info)
  }

  if (destructive) {
    next.destructive = destructive
    next.destructiveForeground = getForegroundColor(destructive)
    next.error = destructive
    next.errorForeground = getForegroundColor(destructive)
  }

  if (muted) {
    next.muted = muted
    next.mutedForeground = getForegroundColor(muted)
    next.badgeBackground = muted
    next.badgeForeground = getForegroundColor(muted)
  }

  if (border) {
    next.border = border
    next.divider = border
  }

  if (ring) {
    next.borderFocus = ring
  }

  if (input) {
    next.inputBorder = input
  }

  if (!next.surface && background) {
    next.surface = shiftSurface(background, scheme, 0.04)
    next.surfaceAlt = shiftSurface(next.surface, scheme, 0.08)
  }

  const effectiveText = next.text ?? baseColors.text
  const effectiveBackground = next.background ?? baseColors.background
  const effectiveSurface = next.surface ?? baseColors.surface
  const effectiveMuted = next.muted ?? baseColors.muted

  next.textMuted =
    muted != null
      ? getForegroundColor(effectiveMuted)
      : (mix(effectiveText, effectiveBackground, 0.45) as HexColor)

  next.inputBackground = effectiveSurface
  next.inputText = effectiveText
  next.inputPlaceholder = mix(
    next.textMuted ?? baseColors.textMuted,
    effectiveBackground,
    0.35,
  ) as HexColor
  next.badgeBackground = next.badgeBackground ?? effectiveMuted
  next.badgeForeground = next.badgeForeground ?? next.mutedForeground ?? baseColors.badgeForeground
  next.borderFocus = next.borderFocus ?? next.primary ?? baseColors.primary

  return next
}

function mapSpacing(scale: ContractThemeFragment['spacing']): SpacingTokens | undefined {
  if (!scale) {
    return undefined
  }

  const factor = SPACING_FACTORS[scale]
  return {
    0: defaultSpacing[0],
    1: Math.round(defaultSpacing[1] * factor),
    2: Math.round(defaultSpacing[2] * factor),
    3: Math.round(defaultSpacing[3] * factor),
    4: Math.round(defaultSpacing[4] * factor),
    5: Math.round(defaultSpacing[5] * factor),
    6: Math.round(defaultSpacing[6] * factor),
    8: Math.round(defaultSpacing[8] * factor),
    10: Math.round(defaultSpacing[10] * factor),
    12: Math.round(defaultSpacing[12] * factor),
    16: Math.round(defaultSpacing[16] * factor),
    20: Math.round(defaultSpacing[20] * factor),
  }
}

function mapTypography(font: ContractThemeFragment['font']): TypographyTokens | undefined {
  if (!font?.baseSize && !font?.scale) {
    return undefined
  }

  const baseSize = font.baseSize ?? defaultTypography.fontSizeMd
  const scale = font.scale ?? 1.2
  return {
    fontSizeXs: Math.round(baseSize / (scale * scale)),
    fontSizeSm: Math.round(baseSize / scale),
    fontSizeMd: Math.round(baseSize),
    fontSizeLg: Math.round(baseSize * scale),
    fontSizeXl: Math.round(baseSize * scale * scale),
    fontSize2xl: Math.round(baseSize * scale * scale * scale),
    fontSize3xl: Math.round(baseSize * scale * scale * scale * 1.25),
    fontSize4xl: Math.round(baseSize * scale * scale * scale * 1.5),
    fontSize5xl: Math.round(baseSize * scale * scale * scale * 2),
    lineHeightTight: defaultTypography.lineHeightTight,
    lineHeightNormal: defaultTypography.lineHeightNormal,
    lineHeightRelaxed: defaultTypography.lineHeightRelaxed,
    fontWeightRegular: defaultTypography.fontWeightRegular,
    fontWeightMedium: defaultTypography.fontWeightMedium,
    fontWeightSemibold: defaultTypography.fontWeightSemibold,
    fontWeightBold: defaultTypography.fontWeightBold,
  }
}

function mapAnimation(tokens: ContractThemeFragment['tokens']): AnimationTokens | undefined {
  if (!tokens?.durations && !tokens?.easings) {
    return undefined
  }

  return {
    durationFast: tokens.durations?.fast ?? defaultAnimation.durationFast,
    durationNormal: tokens.durations?.normal ?? defaultAnimation.durationNormal,
    durationSlow: tokens.durations?.slow ?? defaultAnimation.durationSlow,
    durationVSlow: Math.max(
      tokens.durations?.slow ?? defaultAnimation.durationSlow,
      defaultAnimation.durationVSlow,
    ),
    easingDefault: tokens.easings?.default ?? defaultAnimation.easingDefault,
    easingSpring: tokens.easings?.spring ?? defaultAnimation.easingSpring,
    easingEaseOut: tokens.easings?.out ?? defaultAnimation.easingEaseOut,
    easingEaseInOut: tokens.easings?.inOut ?? defaultAnimation.easingEaseInOut,
  }
}

function mapOpacity(tokens: ContractThemeFragment['tokens']): DesignTokens['opacity'] | undefined {
  if (!tokens?.opacity) {
    return undefined
  }

  return {
    transparent: defaultOpacity.transparent,
    subtle: tokens.opacity.hover ?? defaultOpacity.subtle,
    light: defaultOpacity.light,
    medium: tokens.opacity.muted ?? defaultOpacity.medium,
    heavy: defaultOpacity.heavy,
    opaque: tokens.opacity.disabled ?? defaultOpacity.opaque,
    full: defaultOpacity.full,
  }
}

function mergeThemeFragments(
  base: ContractThemeFragment,
  next: ContractThemeFragment | undefined,
): ContractThemeFragment {
  if (!next) {
    return base
  }

  return {
    colors: { ...(base.colors ?? {}), ...(next.colors ?? {}) },
    darkColors: { ...(base.darkColors ?? {}), ...(next.darkColors ?? {}) },
    radius: next.radius ?? base.radius,
    spacing: next.spacing ?? base.spacing,
    font: { ...(base.font ?? {}), ...(next.font ?? {}) },
    tokens: {
      ...(base.tokens ?? {}),
      ...(next.tokens ?? {}),
      durations: {
        ...(base.tokens?.durations ?? {}),
        ...(next.tokens?.durations ?? {}),
      },
      easings: {
        ...(base.tokens?.easings ?? {}),
        ...(next.tokens?.easings ?? {}),
      },
      opacity: {
        ...(base.tokens?.opacity ?? {}),
        ...(next.tokens?.opacity ?? {}),
      },
    },
  }
}

function resolveContractTheme(theme: ThemeConfig | undefined): {
  baseFlavor: string
  mode: 'light' | 'dark' | 'system' | undefined
  fragment: ContractThemeFragment
} {
  if (!theme) {
    return {
      baseFlavor: 'neutral',
      mode: undefined,
      fragment: {},
    }
  }

  let baseFlavor = theme.flavor ?? 'neutral'
  let fragment: ContractThemeFragment = {}
  const visited = new Set<string>()

  while (theme.flavors?.[baseFlavor]) {
    if (visited.has(baseFlavor)) {
      break
    }

    visited.add(baseFlavor)
    const declaration = theme.flavors[baseFlavor]
    fragment = mergeThemeFragments(fragment, declaration)
    baseFlavor = declaration.extends
  }

  fragment = mergeThemeFragments(fragment, theme.overrides)

  return {
    baseFlavor: LOCAL_FLAVOR_NAMES.has(baseFlavor) ? baseFlavor : 'neutral',
    mode: theme.mode,
    fragment,
  }
}

export function contractThemeToTokenConfig(theme: ThemeConfig | undefined): TokenConfig {
  const resolved = resolveContractTheme(theme)
  return {
    flavor: resolved.baseFlavor,
    colorScheme: resolved.mode,
  }
}

export function resolveContractTokens(
  theme: ThemeConfig | undefined,
  systemColorScheme: 'light' | 'dark',
  runtimeOverrides?: DeepPartial<DesignTokens>,
): DesignTokens {
  const resolved = resolveContractTheme(theme)
  const tokenConfig = contractThemeToTokenConfig(theme)
  const baseTokens = resolveLocalTokens(tokenConfig, systemColorScheme)
  const scheme =
    tokenConfig.colorScheme === 'system' ? systemColorScheme : (tokenConfig.colorScheme ?? 'light')

  const contractColors =
    scheme === 'dark' && Object.keys(resolved.fragment.darkColors ?? {}).length > 0
      ? resolved.fragment.darkColors
      : resolved.fragment.colors

  const contractOverrides: DeepPartial<DesignTokens> = {}
  const colorOverrides = mapThemeColorsToNative(contractColors, scheme, baseTokens.colors)
  if (Object.keys(colorOverrides).length > 0) {
    contractOverrides.colors = colorOverrides
  }

  if (resolved.fragment.radius) {
    contractOverrides.radius = RADIUS_PRESETS[resolved.fragment.radius]
  }

  const spacing = mapSpacing(resolved.fragment.spacing)
  if (spacing) {
    contractOverrides.spacing = spacing
  }

  const typography = mapTypography(resolved.fragment.font)
  if (typography) {
    contractOverrides.typography = typography
  }

  const animation = mapAnimation(resolved.fragment.tokens)
  if (animation) {
    contractOverrides.animation = animation
  }

  const opacity = mapOpacity(resolved.fragment.tokens)
  if (opacity) {
    contractOverrides.opacity = opacity
  }

  const overrides = runtimeOverrides
    ? deepMerge(contractOverrides, runtimeOverrides)
    : contractOverrides

  return resolveLocalTokens({ ...tokenConfig, overrides }, systemColorScheme)
}
