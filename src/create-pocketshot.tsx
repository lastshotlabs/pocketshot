import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import React, { type ReactNode } from 'react'
import { ApiClient } from './api/client'
import { mergeContract } from './auth/contract'
import type { PocketshotAuthContractConfig } from './auth/contract'
import { createAuthErrorFormatter } from './auth/errors'
import type { AuthErrorConfig } from './auth/errors'
import { createAuthHooks } from './auth/hooks'
import { createSecureStoreStorage } from './auth/storage'
import { warnOnce } from './lib/warnings'
import { PocketshotWS, createWsHooks, notConfigured } from './ws/index'

export interface PocketshotConfig {
  apiUrl: string
  wsUrl?: string
  tokenKey?: string
  loginPath?: string
  homePath?: string
  mfaPath?: string
  staleTime?: number
  contract?: PocketshotAuthContractConfig
  authErrors?: AuthErrorConfig
}

export function createPocketshot(config: PocketshotConfig) {
  const contract = mergeContract(config.apiUrl, config.contract)

  if (config.apiUrl.startsWith('http://')) {
    warnOnce('insecure-url', '[pocketshot] apiUrl uses http:// — insecure in production')
  }
  if (config.authErrors?.verbose) {
    warnOnce('verbose-errors', '[pocketshot] authErrors.verbose is enabled — disable in production')
  }

  const formatAuthError = createAuthErrorFormatter(config.authErrors)
  const tokenStorage = createSecureStoreStorage(config.tokenKey ?? 'pocketshot_token')
  const api = new ApiClient({ baseUrl: config.apiUrl, tokenStorage, contract })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: config.staleTime ?? 300_000, retry: false } },
  })
  const wsManager = config.wsUrl ? new PocketshotWS(config.wsUrl, tokenStorage) : null
  const hooks = createAuthHooks({ api, tokenStorage, queryClient, config, contract })
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

  return { ...hooks, ...wsHooks, Providers, api, queryClient, tokenStorage, formatAuthError }
}
