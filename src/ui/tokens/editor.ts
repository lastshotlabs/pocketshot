import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import type { DesignTokens, DeepPartial } from './types'

/**
 * Hook that lets components read and mutate live token overrides at runtime.
 * Useful for building in-app theme editors or per-tenant customization UIs.
 *
 * Overrides are now scoped to the active AppContextProvider instead of module
 * singletons, so multiple Pocketshot runtimes can coexist safely.
 */
export function useTokenEditor() {
  const { tokenOverrides, setTokenOverride, setTokenOverrides, clearTokenOverrides } =
    useAppContext()

  const setOverride = useCallback(
    <K1 extends keyof DesignTokens>(
      path: [K1, keyof DesignTokens[K1]],
      value: DesignTokens[K1][(typeof path)[1]],
    ) => {
      setTokenOverride(path, value)
    },
    [setTokenOverride],
  )

  const setAllOverrides = useCallback(
    (next: DeepPartial<DesignTokens>) => {
      setTokenOverrides(next)
    },
    [setTokenOverrides],
  )

  const clearOverrides = useCallback(() => {
    clearTokenOverrides()
  }, [clearTokenOverrides])

  return { overrides: tokenOverrides, setOverride, setAllOverrides, clearOverrides }
}

export function useTokenOverrides(): DeepPartial<DesignTokens> {
  return useAppContext().tokenOverrides
}
