import { useCallback } from 'react'
import { atom, useAtom } from 'jotai'
import type { DesignTokens, DeepPartial } from './types'

// Global atom — one instance per app (singleton pattern via module scope)
const tokenOverridesAtom = atom<DeepPartial<DesignTokens>>({})

/**
 * Hook that lets components read and mutate live token overrides at runtime.
 * Useful for building in-app theme editors or per-tenant customization UIs.
 *
 * The overrides returned here are deep-merged on top of the resolved base tokens
 * by the theme system (see useTheme in src/theme/).
 *
 * @example
 * const { overrides, setOverride, clearOverrides } = useTokenEditor()
 * setOverride(['colors', 'primary'], '#ff0000')
 */
export function useTokenEditor() {
  const [overrides, setOverrides] = useAtom(tokenOverridesAtom)

  /**
   * Set a single token override by path.
   * @example setOverride(['colors', 'primary'], '#ff0000')
   * @example setOverride(['spacing', '4'], 20)
   */
  const setOverride = useCallback(
    <K1 extends keyof DesignTokens>(
      path: [K1, keyof DesignTokens[K1]],
      value: DesignTokens[K1][(typeof path)[1]],
    ) => {
      setOverrides((prev) => {
        const [topKey, subKey] = path
        return {
          ...prev,
          [topKey]: {
            ...((prev[topKey] as object) ?? {}),
            [subKey]: value,
          },
        }
      })
    },
    [setOverrides],
  )

  /** Replace the entire overrides object */
  const setAllOverrides = useCallback(
    (next: DeepPartial<DesignTokens>) => {
      setOverrides(next)
    },
    [setOverrides],
  )

  /** Clear all runtime overrides */
  const clearOverrides = useCallback(() => {
    setOverrides({})
  }, [setOverrides])

  return { overrides, setOverride, setAllOverrides, clearOverrides }
}

/** Read-only access to current token overrides (no setter). */
export function useTokenOverrides(): DeepPartial<DesignTokens> {
  const [overrides] = useAtom(tokenOverridesAtom)
  return overrides
}
