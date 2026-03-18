import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import React, { type ReactNode } from 'react'
import { ApiClient } from './api/client'
import { createAuthHooks } from './auth/hooks'
import { createSecureStoreStorage } from './auth/storage'
import { PocketshotWS, createWsHooks, notConfigured } from './ws/index'

export interface PocketshotConfig {
  apiUrl: string
  wsUrl?: string
  tokenKey?: string
  loginPath?: string
  homePath?: string
  mfaPath?: string
  staleTime?: number
}

export function createPocketshot(config: PocketshotConfig) {
  const tokenStorage = createSecureStoreStorage(config.tokenKey ?? 'pocketshot_token')
  const api = new ApiClient({ baseUrl: config.apiUrl, tokenStorage })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: config.staleTime ?? 300_000, retry: false } },
  })
  const wsManager = config.wsUrl ? new PocketshotWS(config.wsUrl, tokenStorage) : null
  const hooks = createAuthHooks({ api, tokenStorage, queryClient, config })
  const wsHooks = wsManager
    ? createWsHooks(wsManager)
    : { useRoom: notConfigured, useRoomEvent: notConfigured }

  function Providers({ children }: { children: ReactNode }) {
    return (
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </JotaiProvider>
    )
  }

  return { ...hooks, ...wsHooks, Providers, api, queryClient, tokenStorage }
}
