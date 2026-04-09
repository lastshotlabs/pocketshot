import type { DesignTokens, TokenConfig, DeepPartial } from './types'
import { defaultSpacing, defaultRadius, defaultTypography, defaultShadows } from './schema'
import { flavors } from './flavors'

/**
 * Resolves a complete DesignTokens object from a TokenConfig.
 * - Picks the flavor (default: 'neutral')
 * - Picks light or dark ColorTokens based on colorScheme
 * - Deep-merges overrides on top
 *
 * This is a pure function — no side effects, no React, testable in isolation.
 */
export function resolveTokens(
  config: TokenConfig,
  systemColorScheme: 'light' | 'dark',
): DesignTokens {
  const flavorName = config.flavor ?? 'neutral'
  const flavor = flavors[flavorName] ?? flavors['neutral']!

  const scheme =
    config.colorScheme === 'system' ? systemColorScheme : (config.colorScheme ?? 'light')

  const colors = scheme === 'dark' ? flavor.dark : flavor.light

  const base: DesignTokens = {
    colors,
    spacing: defaultSpacing,
    radius: defaultRadius,
    typography: defaultTypography,
    shadows: defaultShadows,
  }

  if (!config.overrides) return base
  return deepMerge(base, config.overrides) as DesignTokens
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
        base[key] as object,
        overrideVal as DeepPartial<object>,
      ) as T[typeof key]
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[typeof key]
    }
  }
  return result
}
