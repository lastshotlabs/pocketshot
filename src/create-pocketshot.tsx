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
import { validateConfig } from './auth/warnings'
import { createCommunityHooks } from './community/hooks'
import { createWebhookHooks } from './webhooks/hooks'
import { createDeviceHooks } from './device/index'
import { AppStateManager } from './app-state/manager'
import { PocketshotWS, createWsHooks, notConfigured } from './ws/index'
import { createSseHooks } from './sse/index'
import {
  useBiometricAvailability,
  useBiometricAuth,
  useBiometricGate,
  checkBiometricAvailability,
  promptBiometric,
} from './biometrics/index'
import { haptics, useHaptics } from './haptics/index'
import { createPushHooks } from './push/index'
import { useDeepLink, useDeepLinkRouter, parseDeepLink, matchPattern, createDeepLinkUrl } from './deep-links/index'
import { createOfflineHooks } from './offline/index'
import { useShare, useClipboard, share, shareFile, getClipboardString, setClipboardString, hasClipboardString } from './share/index'
import { createOrgHooks } from './organizations/index'
import { createPermissionHooks } from './permissions/index'
import { createSearchHooks } from './search/index'
import { createUploadHooks } from './upload/index'

export interface PocketshotConfig {
  apiUrl: string
  wsEndpoint?: string
  tokenKey?: string
  loginPath?: string
  homePath?: string
  mfaPath?: string
  staleTime?: number
  contract?: PocketshotAuthContractConfig
  authErrors?: AuthErrorConfig
}

/**
 * Bootstraps the Pocketshot SDK. Call this once — typically in a module-level
 * singleton — and spread the returned hooks into your components.
 *
 * In development builds, `validateConfig` emits one-time console warnings for
 * common misconfigurations (insecure URLs, missing leading slashes, etc.).
 *
 * @param config - SDK configuration options.
 * @returns A flat object containing all hooks, helpers, and the `Providers` wrapper.
 */
export function createPocketshot(config: PocketshotConfig) {
  validateConfig(config)

  const contract = mergeContract(config.apiUrl, config.contract)

  const formatAuthError = createAuthErrorFormatter(config.authErrors)
  const tokenStorage = createSecureStoreStorage(config.tokenKey ?? 'pocketshot_token')
  const api = new ApiClient({ baseUrl: config.apiUrl, tokenStorage, contract })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: config.staleTime ?? 300_000, retry: false } },
  })
  const appStateManager = new AppStateManager()
  appStateManager.start()
  const wsManager = config.wsEndpoint
    ? new PocketshotWS(config.wsEndpoint, tokenStorage, appStateManager)
    : null
  const hooks = createAuthHooks({ api, tokenStorage, queryClient, config, contract })
  const wsHooks = wsManager
    ? createWsHooks(wsManager)
    : { useRoom: notConfigured, useRoomEvent: notConfigured }
  const sseHooks = createSseHooks({ tokenStorage, appStateManager })
  const communityHooks = createCommunityHooks(api)
  const webhookHooks = createWebhookHooks(api)
  const deviceHooks = createDeviceHooks(api)
  const pushHooks = createPushHooks(api)
  const offlineHooks = createOfflineHooks({ api, appStateManager })
  const orgHooks = createOrgHooks(api)
  const permissionHooks = createPermissionHooks(api)
  const searchHooks = createSearchHooks(api)
  const uploadHooks = createUploadHooks(api, { baseUrl: config.apiUrl, tokenStorage })

  function Providers({ children }: { children: ReactNode }) {
    return (
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </JotaiProvider>
    )
  }

  return {
    ...hooks,
    ...wsHooks,
    ...sseHooks,
    ...communityHooks,
    ...webhookHooks,
    ...deviceHooks,
    useBiometricAvailability,
    useBiometricAuth,
    useBiometricGate,
    checkBiometricAvailability,
    promptBiometric,
    haptics,
    useHaptics,
    ...pushHooks,
    useDeepLink,
    useDeepLinkRouter,
    parseDeepLink,
    matchPattern,
    createDeepLinkUrl,
    ...offlineHooks,
    useShare,
    useClipboard,
    share,
    shareFile,
    getClipboardString,
    setClipboardString,
    hasClipboardString,
    ...orgHooks,
    ...permissionHooks,
    ...searchHooks,
    ...uploadHooks,
    Providers,
    api,
    queryClient,
    tokenStorage,
    formatAuthError,
    appStateManager,
  }
}
