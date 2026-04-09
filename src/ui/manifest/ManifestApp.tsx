import React from 'react'
import { AppContextProvider } from '../context/AppContext'
import type { ApiClient } from '../../api/client'
import type { DesignTokens, TokenConfig } from '../tokens/types'
import type { ManifestConfig, ScreenConfig, ComponentConfig } from './types'
import { ScreenRenderer } from './renderer'

interface ManifestAppProps {
  manifest: ManifestConfig
  api: ApiClient
  tokens: DesignTokens
  tokenConfig: TokenConfig
  /** The current screen config to render. Typically derived from the active route. */
  currentScreen: ScreenConfig
  /** Registry of component type key → React component. */
  componentRegistry: Record<string, React.ComponentType<ComponentConfig>>
}

/**
 * Root component for config-driven apps. Wraps the entire app in AppContextProvider
 * and renders the current screen via ScreenRenderer.
 *
 * @example
 * <ManifestApp
 *   manifest={manifest}
 *   api={pocketshot.api}
 *   tokens={resolvedTokens}
 *   tokenConfig={{ flavor: 'violet', colorScheme: 'system' }}
 *   currentScreen={manifest.screens[route.path]}
 *   componentRegistry={componentRegistry}
 * />
 */
export function ManifestApp({
  api,
  tokens,
  tokenConfig,
  currentScreen,
  componentRegistry,
}: ManifestAppProps) {
  return (
    <AppContextProvider api={api} tokens={tokens} tokenConfig={tokenConfig}>
      <ScreenRenderer screen={currentScreen} api={api} componentRegistry={componentRegistry} />
    </AppContextProvider>
  )
}
