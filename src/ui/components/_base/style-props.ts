import type { DesignTokens } from '../../tokens/types'

type NativeStyleConfig = Record<string, unknown>
type NativeResolvedStyle = Record<string, unknown>

const spacingTokenMap = {
  none: 0,
  '2xs': 1,
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
  '2xl': 8,
  '3xl': 12,
} as const

const radiusTokenMap = {
  none: 'none',
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  full: 'full',
} as const

const shadowTokenMap = {
  none: 'none',
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
} as const

const fontSizeTokenMap = {
  xs: 'fontSizeXs',
  sm: 'fontSizeSm',
  base: 'fontSizeMd',
  lg: 'fontSizeLg',
  xl: 'fontSizeXl',
  '2xl': 'fontSize2xl',
  '3xl': 'fontSize3xl',
  '4xl': 'fontSize4xl',
} as const

const fontWeightTokenMap = {
  light: '400',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

const lineHeightTokenMap = {
  none: 1,
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const

const letterSpacingTokenMap = {
  tight: -0.25,
  normal: 0,
  wide: 0.25,
} as const

const colorAliasMap = {
  foreground: 'text',
  card: 'surface',
  popover: 'surfaceAlt',
  input: 'inputBackground',
  'primary-foreground': 'primaryForeground',
  'secondary-foreground': 'secondaryForeground',
  'muted-foreground': 'mutedForeground',
  'accent-foreground': 'accentForeground',
  'destructive-foreground': 'destructiveForeground',
  'error-foreground': 'errorForeground',
  'success-foreground': 'successForeground',
  'warning-foreground': 'warningForeground',
  'info-foreground': 'infoForeground',
  'card-foreground': 'text',
  'popover-foreground': 'text',
  'input-border': 'inputBorder',
  'input-text': 'inputText',
  'input-placeholder': 'inputPlaceholder',
} as const

export function resolveNativeStyleProps(
  config: NativeStyleConfig,
  tokens: DesignTokens,
): NativeResolvedStyle {
  const style: NativeResolvedStyle = {}

  const background = baseValue(config.background)
  if (background != null && typeof background === 'string') {
    style.backgroundColor = resolveColor(background, tokens)
  }

  const backgroundColor = baseValue(config.backgroundColor)
  if (backgroundColor != null) {
    style.backgroundColor = resolveColor(backgroundColor, tokens)
  }

  applyBoxSpacing(style, 'padding', baseValue(config.padding), tokens)
  applyAxisSpacing(style, ['paddingLeft', 'paddingRight'], baseValue(config.paddingX), tokens)
  applyAxisSpacing(style, ['paddingTop', 'paddingBottom'], baseValue(config.paddingY), tokens)
  applySideSpacing(style, 'paddingTop', baseValue(config.paddingTop), tokens)
  applySideSpacing(style, 'paddingRight', baseValue(config.paddingRight), tokens)
  applySideSpacing(style, 'paddingBottom', baseValue(config.paddingBottom), tokens)
  applySideSpacing(style, 'paddingLeft', baseValue(config.paddingLeft), tokens)

  applyBoxSpacing(style, 'margin', baseValue(config.margin), tokens)
  applyAxisSpacing(style, ['marginLeft', 'marginRight'], baseValue(config.marginX), tokens)
  applyAxisSpacing(style, ['marginTop', 'marginBottom'], baseValue(config.marginY), tokens)
  applySideSpacing(style, 'marginTop', baseValue(config.marginTop), tokens)
  applySideSpacing(style, 'marginRight', baseValue(config.marginRight), tokens)
  applySideSpacing(style, 'marginBottom', baseValue(config.marginBottom), tokens)
  applySideSpacing(style, 'marginLeft', baseValue(config.marginLeft), tokens)

  const gap = resolveSpacing(baseValue(config.gap), tokens)
  if (gap != null) style.gap = gap

  applyDimension(style, 'width', baseValue(config.width))
  applyDimension(style, 'minWidth', baseValue(config.minWidth))
  applyDimension(style, 'maxWidth', baseValue(config.maxWidth))
  applyDimension(style, 'height', baseValue(config.height))
  applyDimension(style, 'minHeight', baseValue(config.minHeight))
  applyDimension(style, 'maxHeight', baseValue(config.maxHeight))

  if (config.bg != null) {
    const bg = baseValue(config.bg)
    if (typeof bg === 'string') {
      style.backgroundColor = resolveColor(bg, tokens)
    }
  }

  if (config.color != null) {
    style.color = resolveColor(baseValue(config.color), tokens)
  }

  const borderRadius = resolveRadius(baseValue(config.borderRadius), tokens)
  if (borderRadius != null) style.borderRadius = borderRadius
  applyRadiusStyle(style, 'borderTopLeftRadius', baseValue(config.borderTopLeftRadius), tokens)
  applyRadiusStyle(style, 'borderTopRightRadius', baseValue(config.borderTopRightRadius), tokens)
  applyRadiusStyle(
    style,
    'borderBottomLeftRadius',
    baseValue(config.borderBottomLeftRadius),
    tokens,
  )
  applyRadiusStyle(
    style,
    'borderBottomRightRadius',
    baseValue(config.borderBottomRightRadius),
    tokens,
  )

  if (config.border != null && typeof config.border === 'string') {
    const border = config.border.trim()
    const parts = border.split(/\s+/)
    if (parts[0]) {
      const width = Number(parts[0].replace('px', ''))
      if (!Number.isNaN(width)) style.borderWidth = width
    }
    if (parts[parts.length - 1]) {
      style.borderColor = resolveColor(parts[parts.length - 1]!, tokens)
    }
  }
  applyNumericStyle(style, 'borderWidth', baseValue(config.borderWidth))
  applyColorStyle(style, 'borderColor', baseValue(config.borderColor), tokens)
  applyNumericStyle(style, 'borderTopWidth', baseValue(config.borderTopWidth))
  applyColorStyle(style, 'borderTopColor', baseValue(config.borderTopColor), tokens)
  applyNumericStyle(style, 'borderRightWidth', baseValue(config.borderRightWidth))
  applyColorStyle(style, 'borderRightColor', baseValue(config.borderRightColor), tokens)
  applyNumericStyle(style, 'borderBottomWidth', baseValue(config.borderBottomWidth))
  applyColorStyle(style, 'borderBottomColor', baseValue(config.borderBottomColor), tokens)
  applyNumericStyle(style, 'borderLeftWidth', baseValue(config.borderLeftWidth))
  applyColorStyle(style, 'borderLeftColor', baseValue(config.borderLeftColor), tokens)

  if (config.shadow != null) {
    Object.assign(style, resolveShadow(baseValue(config.shadow), tokens))
  }

  if (config.opacity != null) {
    style.opacity = Number(config.opacity)
  }

  if (config.overflow != null) {
    style.overflow = String(config.overflow)
  }

  if (config.position != null) {
    style.position = String(config.position)
  }

  if (config.inset != null) {
    const inset = resolveInsetValue(baseValue(config.inset), tokens)
    if (inset != null) {
      style.top = inset
      style.right = inset
      style.bottom = inset
      style.left = inset
    }
  }
  applyInsetStyle(style, 'top', baseValue(config.top), tokens)
  applyInsetStyle(style, 'right', baseValue(config.right), tokens)
  applyInsetStyle(style, 'bottom', baseValue(config.bottom), tokens)
  applyInsetStyle(style, 'left', baseValue(config.left), tokens)

  const display = baseValue(config.display)
  if (display != null) {
    style.display = String(display)
  }

  const flexDirection = baseValue(config.flexDirection)
  if (flexDirection != null) {
    style.flexDirection = String(flexDirection)
  }

  if (config.alignItems != null) {
    style.alignItems = resolveAlignItems(String(config.alignItems))
  }

  if (config.justifyContent != null) {
    style.justifyContent = resolveJustifyContent(String(config.justifyContent))
  }

  if (config.flexWrap != null) {
    style.flexWrap = String(config.flexWrap)
  }

  if (config.flex != null) {
    style.flex = typeof config.flex === 'number' ? config.flex : Number(config.flex)
  }
  applyNumericStyle(style, 'flexGrow', baseValue(config.flexGrow))
  applyNumericStyle(style, 'flexShrink', baseValue(config.flexShrink))
  applyAlignSelfStyle(style, baseValue(config.alignSelf))

  if (config.textAlign != null) {
    style.textAlign = String(config.textAlign)
  }

  const fontSize = resolveFontSize(baseValue(config.fontSize), tokens)
  if (fontSize != null) style.fontSize = fontSize

  const fontWeight = resolveFontWeight(baseValue(config.fontWeight))
  if (fontWeight != null) style.fontWeight = fontWeight

  const lineHeight = resolveLineHeight(baseValue(config.lineHeight), fontSize)
  if (lineHeight != null) style.lineHeight = lineHeight

  const letterSpacing = resolveLetterSpacing(baseValue(config.letterSpacing))
  if (letterSpacing != null) style.letterSpacing = letterSpacing

  if (config.textDecorationLine != null) {
    style.textDecorationLine = String(baseValue(config.textDecorationLine))
  }

  if (config.fontStyle != null) {
    style.fontStyle = String(baseValue(config.fontStyle))
  }

  if (config.textTransform != null) {
    style.textTransform = String(baseValue(config.textTransform))
  }

  const zIndex = resolveZIndex(baseValue(config.zIndex), tokens)
  if (zIndex != null) style.zIndex = zIndex

  const aspectRatio = resolveNumber(baseValue(config.aspectRatio))
  if (aspectRatio != null) style.aspectRatio = aspectRatio

  return style
}

function baseValue(value: unknown): unknown {
  if (
    value != null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'default' in (value as Record<string, unknown>)
  ) {
    return (value as Record<string, unknown>).default
  }
  return value
}

function resolveSpacing(value: unknown, tokens: DesignTokens): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  const token = spacingTokenMap[value as keyof typeof spacingTokenMap]
  if (token != null) {
    return tokens.spacing[token]
  }
  const numeric = Number(value)
  return Number.isNaN(numeric) ? undefined : numeric
}

function resolveSpacingOrRaw(value: unknown, tokens: DesignTokens): number | string | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  const token = spacingTokenMap[value as keyof typeof spacingTokenMap]
  if (token != null) {
    return tokens.spacing[token]
  }
  const numeric = Number(value)
  return Number.isNaN(numeric) ? String(value) : numeric
}

function resolveRadius(value: unknown, tokens: DesignTokens): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  const token = radiusTokenMap[value as keyof typeof radiusTokenMap]
  if (token != null) {
    return tokens.radius[token]
  }
  const numeric = Number(value)
  return Number.isNaN(numeric) ? undefined : numeric
}

function resolveShadow(value: unknown, tokens: DesignTokens): NativeResolvedStyle {
  if (value == null) return {}
  const token =
    typeof value === 'string' ? shadowTokenMap[value as keyof typeof shadowTokenMap] : undefined
  return token ? { ...tokens.shadows[token] } : {}
}

function resolveColor(value: unknown, tokens: DesignTokens): string {
  if (typeof value !== 'string') {
    return String(value ?? '')
  }
  if (value in tokens.colors) {
    return tokens.colors[value as keyof typeof tokens.colors]
  }
  const alias = colorAliasMap[value as keyof typeof colorAliasMap]
  return alias ? tokens.colors[alias] : value
}

function resolveFontSize(value: unknown, tokens: DesignTokens): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  const token = fontSizeTokenMap[value as keyof typeof fontSizeTokenMap]
  if (token != null) {
    return tokens.typography[token]
  }
  const numeric = Number(value)
  return Number.isNaN(numeric) ? undefined : numeric
}

function resolveFontWeight(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return String(value)
  return fontWeightTokenMap[value as keyof typeof fontWeightTokenMap] ?? String(value)
}

function resolveLineHeight(value: unknown, fontSize?: number): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') {
    return fontSize ? fontSize * value : value
  }
  const token = lineHeightTokenMap[value as keyof typeof lineHeightTokenMap]
  if (token != null) {
    return fontSize ? fontSize * token : token
  }
  const numeric = Number(value)
  return Number.isNaN(numeric) ? undefined : numeric
}

function resolveLetterSpacing(value: unknown): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  const token = letterSpacingTokenMap[value as keyof typeof letterSpacingTokenMap]
  if (token != null) return token
  const numeric = Number(value)
  return Number.isNaN(numeric) ? undefined : numeric
}

function resolveAlignItems(value: string): string {
  switch (value) {
    case 'start':
      return 'flex-start'
    case 'end':
      return 'flex-end'
    default:
      return value
  }
}

function resolveAlignSelf(value: string): string {
  switch (value) {
    case 'start':
      return 'flex-start'
    case 'end':
      return 'flex-end'
    default:
      return value
  }
}

function resolveJustifyContent(value: string): string {
  switch (value) {
    case 'start':
      return 'flex-start'
    case 'end':
      return 'flex-end'
    case 'between':
      return 'space-between'
    case 'around':
      return 'space-around'
    case 'evenly':
      return 'space-evenly'
    default:
      return value
  }
}

function applyBoxSpacing(
  style: NativeResolvedStyle,
  property: string,
  value: unknown,
  tokens: DesignTokens,
): void {
  const resolved = resolveSpacing(value, tokens)
  if (resolved != null) style[property] = resolved
}

function applyAxisSpacing(
  style: NativeResolvedStyle,
  properties: [string, string],
  value: unknown,
  tokens: DesignTokens,
): void {
  const resolved = resolveSpacing(value, tokens)
  if (resolved != null) {
    style[properties[0]] = resolved
    style[properties[1]] = resolved
  }
}

function applySideSpacing(
  style: NativeResolvedStyle,
  property: string,
  value: unknown,
  tokens: DesignTokens,
): void {
  const resolved = resolveSpacingOrRaw(value, tokens)
  if (resolved != null) style[property] = resolved
}

function applyDimension(style: NativeResolvedStyle, property: string, value: unknown): void {
  if (value == null) return
  if (typeof value === 'number' || typeof value === 'string') {
    style[property] = value
  }
}

function applyColorStyle(
  style: NativeResolvedStyle,
  property: string,
  value: unknown,
  tokens: DesignTokens,
): void {
  if (value == null) return
  style[property] = resolveColor(value, tokens)
}

function applyNumericStyle(style: NativeResolvedStyle, property: string, value: unknown): void {
  const resolved = resolveNumber(value)
  if (resolved != null) style[property] = resolved
}

function applyRadiusStyle(
  style: NativeResolvedStyle,
  property: string,
  value: unknown,
  tokens: DesignTokens,
): void {
  const resolved = resolveRadius(value, tokens)
  if (resolved != null) style[property] = resolved
}

function applyInsetStyle(
  style: NativeResolvedStyle,
  property: string,
  value: unknown,
  tokens: DesignTokens,
): void {
  const resolved = resolveInsetValue(value, tokens)
  if (resolved != null) style[property] = resolved
}

function applyAlignSelfStyle(style: NativeResolvedStyle, value: unknown): void {
  if (value == null) return
  style.alignSelf = resolveAlignSelf(String(value))
}

function resolveInsetValue(value: unknown, tokens: DesignTokens): number | string | undefined {
  return resolveSpacingOrRaw(value, tokens)
}

function resolveNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return undefined
  const numeric = Number(value)
  return Number.isNaN(numeric) ? undefined : numeric
}

function resolveZIndex(value: unknown, tokens: DesignTokens): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (value in tokens.zIndex) {
      return tokens.zIndex[value as keyof typeof tokens.zIndex]
    }
    const numeric = Number(value)
    return Number.isNaN(numeric) ? undefined : numeric
  }
  return undefined
}
