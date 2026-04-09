import React, { createContext, useContext } from 'react'
import type { ApiClient } from '../../api/client'
import type { DesignTokens, TokenConfig } from '../tokens/types'

export interface AppContextValue {
  api: ApiClient
  tokens: DesignTokens
  tokenConfig: TokenConfig
}

const AppContext = createContext<AppContextValue | null>(null)

/**
 * Provides app-wide SDK context (api client, resolved tokens, token config) to
 * all descendant components. Wrap your root layout with this.
 */
export function AppContextProvider({
  children,
  api,
  tokens,
  tokenConfig,
}: AppContextValue & { children: React.ReactNode }) {
  return <AppContext.Provider value={{ api, tokens, tokenConfig }}>{children}</AppContext.Provider>
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
