import type { HexColor } from './types'

/** Parse a 6-digit hex color to { r, g, b } */
function hexToRgb(hex: HexColor): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/** Convert { r, g, b } back to a HexColor */
function rgbToHex(r: number, g: number, b: number): HexColor {
  return `#${[r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}` as HexColor
}

/**
 * Blend a hex color toward white (amount 0–1).
 * amount=0 → original, amount=1 → white
 */
export function lighten(color: HexColor, amount: number): HexColor {
  const { r, g, b } = hexToRgb(color)
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

/**
 * Blend a hex color toward black (amount 0–1).
 * amount=0 → original, amount=1 → black
 */
export function darken(color: HexColor, amount: number): HexColor {
  const { r, g, b } = hexToRgb(color)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

/**
 * Returns a React Native-compatible rgba() string.
 * React Native StyleSheet accepts both hex and rgba.
 */
export function alpha(color: HexColor, opacity: number): string {
  const { r, g, b } = hexToRgb(color)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/** Mix two hex colors at a given weight (0 = all a, 1 = all b). */
export function mix(colorA: HexColor, colorB: HexColor, weight: number): HexColor {
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  return rgbToHex(
    a.r + (b.r - a.r) * weight,
    a.g + (b.g - a.g) * weight,
    a.b + (b.b - a.b) * weight,
  )
}
