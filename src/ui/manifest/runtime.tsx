import React from 'react'
import type { ApiClient } from '../../api/client'
import type { DesignTokens } from '../tokens/types'
import { AppContextProvider } from '../context/AppContext'
import type { ManifestConfig } from './types'

interface ManifestRuntimeProviderProps {
  children: React.ReactNode
  manifest: ManifestConfig
  api: ApiClient
  tokens?: DesignTokens
}

export function ManifestRuntimeProvider({
  children,
  manifest,
  api,
  tokens,
}: ManifestRuntimeProviderProps) {
  return (
    <AppContextProvider api={api} manifest={manifest} theme={manifest.theme} tokens={tokens}>
      {children}
    </AppContextProvider>
  )
}
