import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance } from 'react-native'
import type { SharedManifestSections } from '@lastshotlabs/frontend-contract/manifest'
import type { ThemeConfig } from '@lastshotlabs/frontend-contract/tokens'
import type { ApiClient } from '../../api/client'
import { contractThemeToTokenConfig, resolveContractTokens } from '../tokens/contract'
import type { DeepPartial, DesignTokens, TokenConfig } from '../tokens/types'

export interface AppContextValue {
  api: ApiClient
  tokens: DesignTokens
  tokenConfig: TokenConfig
  theme?: ThemeConfig
  manifest: SharedManifestSections
  tokenOverrides: DeepPartial<DesignTokens>
  setTokenOverrides: (next: DeepPartial<DesignTokens>) => void
  setTokenOverride: <K1 extends keyof DesignTokens>(
    path: [K1, keyof DesignTokens[K1]],
    value: DesignTokens[K1][(typeof path)[1]],
  ) => void
  clearTokenOverrides: () => void
  setTheme: (next: Partial<Pick<ThemeConfig, 'mode' | 'flavor'>>) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export interface AppContextProviderProps {
  children: React.ReactNode
  api: ApiClient
  manifest?: SharedManifestSections
  theme?: ThemeConfig
  tokenConfig?: TokenConfig
  tokens?: DesignTokens
}

/**
 * Provides app-wide SDK context (api client, resolved tokens, token config) to
 * all descendant components. Wrap your root layout with this.
 */
export function AppContextProvider({
  children,
  api,
  manifest,
  theme,
  tokenConfig,
  tokens,
}: AppContextProviderProps) {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  )
  const [tokenOverrides, setTokenOverrides] = useState<DeepPartial<DesignTokens>>({})
  const [themeOverrides, setThemeOverrides] = useState<
    Partial<Pick<ThemeConfig, 'mode' | 'flavor'>>
  >({})

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme === 'dark' ? 'dark' : 'light')
    })
    return () => sub.remove()
  }, [])

  const resolvedTheme = useMemo<ThemeConfig | undefined>(
    () =>
      theme == null && themeOverrides.mode == null && themeOverrides.flavor == null
        ? theme
        : {
            ...(theme ?? {}),
            ...themeOverrides,
          },
    [theme, themeOverrides],
  )

  const normalizedTokenConfig = useMemo(
    () => tokenConfig ?? contractThemeToTokenConfig(resolvedTheme),
    [resolvedTheme, tokenConfig],
  )

  const resolvedTokens = useMemo(
    () =>
      tokens ??
      resolveContractTokens(
        resolvedTheme ?? {
          flavor: normalizedTokenConfig.flavor,
          mode: normalizedTokenConfig.colorScheme,
        },
        systemColorScheme,
        tokenOverrides,
      ),
    [
      normalizedTokenConfig.colorScheme,
      normalizedTokenConfig.flavor,
      resolvedTheme,
      systemColorScheme,
      tokenOverrides,
      tokens,
    ],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      api,
      tokens: resolvedTokens,
      tokenConfig: normalizedTokenConfig,
      theme: resolvedTheme,
      manifest: manifest ?? {},
      tokenOverrides,
      setTokenOverrides,
      setTokenOverride: (path, nextValue) => {
        setTokenOverrides((prev) => {
          const [topKey, subKey] = path
          return {
            ...prev,
            [topKey]: {
              ...((prev[topKey] as object) ?? {}),
              [subKey]: nextValue,
            },
          }
        })
      },
      clearTokenOverrides: () => setTokenOverrides({}),
      setTheme: (next) => {
        setThemeOverrides((prev) => ({ ...prev, ...next }))
      },
    }),
    [api, manifest, normalizedTokenConfig, resolvedTheme, resolvedTokens, tokenOverrides],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * Access the app-wide context. Throws if used outside AppContextProvider.
 */
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('[pocketshot] useAppContext must be used inside AppContextProvider')
  return ctx
}

/**
 * Access the resolved design tokens. Shorthand for `useAppContext().tokens`.
 */
export function useTokens(): DesignTokens {
  return useAppContext().tokens
}
