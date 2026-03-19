import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { atom, useAtom } from 'jotai'
import type { ApiClient } from '../api/client'
import type { TokenStorage } from './storage'
import type { QueryClient } from '@tanstack/react-query'
import type { PocketshotConfig } from '../create-pocketshot'
import type { PocketshotAuthContract } from './contract'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email?: string
  username?: string
  roles?: string[]
  emailVerified?: boolean
  [key: string]: unknown
}

export interface MfaChallenge {
  mfaToken: string
  mfaMethods: string[]
}

export interface LoginResult {
  token?: string
  mfaRequired?: boolean
  mfaToken?: string
  mfaMethods?: string[]
}

export interface SessionInfo {
  sessionId: string
  ip?: string
  userAgent?: string
  createdAt: string
  lastActiveAt?: string
}

export interface MfaMethod {
  type: 'totp' | 'email_otp' | 'webauthn'
  enabled: boolean
}

export interface MfaSetupResult {
  secret: string
  qrCodeUrl: string
  recoveryCodes: string[]
}

// ── Factory ───────────────────────────────────────────────────────────────────

const AUTH_QUERY_KEY = ['auth', 'me'] as const
const SESSIONS_QUERY_KEY = ['sessions'] as const
const MFA_METHODS_QUERY_KEY = ['mfa', 'methods'] as const

export function createAuthHooks(opts: {
  api: ApiClient
  tokenStorage: TokenStorage
  queryClient: QueryClient
  config: PocketshotConfig
  contract: PocketshotAuthContract
}) {
  const { api, tokenStorage, config, contract } = opts

  // Internal MFA pending state atom — not exported to consumers
  const pendingMfaChallengeAtom = atom<MfaChallenge | null>(null)

  // ── useUser ────────────────────────────────────────────────────────────────

  function useUser() {
    const { data: user = null, isLoading, isError } = useQuery<AuthUser | null>({
      queryKey: AUTH_QUERY_KEY,
      queryFn: async () => {
        try {
          return await api.get<AuthUser>(contract.endpoints.me)
        } catch {
          return null
        }
      },
      staleTime: config.staleTime ?? 300_000,
      retry: false,
    })
    return { user, isLoading, isError }
  }

  // ── useLogin ───────────────────────────────────────────────────────────────

  function useLogin() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [, setMfaChallenge] = useAtom(pendingMfaChallengeAtom)

    return useMutation<AuthUser | MfaChallenge, Error, { email: string; password: string }>({
      mutationFn: async ({ email, password }) => {
        const res = await api.post<LoginResult>(contract.endpoints.login, { email, password }, { skipAuth: true })

        if (res.mfaRequired && res.mfaToken) {
          return { mfaToken: res.mfaToken, mfaMethods: res.mfaMethods ?? [] } as MfaChallenge
        }

        if (res.token) {
          await tokenStorage.setToken(res.token)
        }
        return api.get<AuthUser>(contract.endpoints.me)
      },
      onSuccess: (result) => {
        if ('mfaToken' in result) {
          setMfaChallenge(result as MfaChallenge)
          router.replace((config.mfaPath ?? '/(auth)/mfa') as never)
          return
        }
        queryClient.setQueryData(AUTH_QUERY_KEY, result)
        router.replace((config.homePath ?? '/(app)/') as never)
      },
    })
  }

  // ── useRegister ────────────────────────────────────────────────────────────

  function useRegister() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation<AuthUser, Error, { email: string; password: string; [key: string]: unknown }>({
      mutationFn: async (body) => {
        const res = await api.post<{ token?: string; refreshToken?: string } & Record<string, unknown>>(
          contract.endpoints.register,
          body,
          { skipAuth: true },
        )
        if (typeof res.token === 'string') {
          await tokenStorage.setToken(res.token)
        }
        if (typeof res.refreshToken === 'string') {
          await tokenStorage.setRefreshToken(res.refreshToken)
        }
        return api.get<AuthUser>(contract.endpoints.me)
      },
      onSuccess: (user) => {
        queryClient.setQueryData(AUTH_QUERY_KEY, user)
        router.replace((config.homePath ?? '/(app)/') as never)
      },
    })
  }

  // ── useLogout ──────────────────────────────────────────────────────────────

  function useLogout() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [, setMfaChallenge] = useAtom(pendingMfaChallengeAtom)

    return useMutation<void, Error, void>({
      mutationFn: async () => {
        await api.post(contract.endpoints.logout, {}).catch(() => {})
      },
      onSuccess: async () => {
        setMfaChallenge(null)
        await tokenStorage.clearToken()
        await tokenStorage.clearRefreshToken()
        queryClient.clear()
        router.replace((config.loginPath ?? '/(auth)/login') as never)
      },
    })
  }

  // ── useVerifyMfa ───────────────────────────────────────────────────────────

  function useVerifyMfa() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [, setMfaChallenge] = useAtom(pendingMfaChallengeAtom)

    return useMutation<AuthUser, Error, { mfaToken: string; code: string; method: string }>({
      mutationFn: async ({ mfaToken, code, method }) => {
        const res = await api.post<{ token: string; refreshToken?: string }>(
          contract.endpoints.mfaVerify,
          { mfaToken, code, method },
          { skipAuth: true },
        )
        await tokenStorage.setToken(res.token)
        if (res.refreshToken) {
          await tokenStorage.setRefreshToken(res.refreshToken)
        }
        return api.get<AuthUser>(contract.endpoints.me)
      },
      onSuccess: (user) => {
        setMfaChallenge(null)
        queryClient.setQueryData(AUTH_QUERY_KEY, user)
        router.replace((config.homePath ?? '/(app)/') as never)
      },
    })
  }

  // ── useExchangeOAuthCode ───────────────────────────────────────────────────

  function useExchangeOAuthCode() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation<AuthUser, Error, { code: string }>({
      mutationFn: async ({ code }) => {
        const res = await api.post<{ token: string; refreshToken?: string }>(
          contract.endpoints.oauthExchange,
          { code },
          { skipAuth: true },
        )
        await tokenStorage.setToken(res.token)
        if (res.refreshToken) {
          await tokenStorage.setRefreshToken(res.refreshToken)
        }
        return api.get<AuthUser>(contract.endpoints.me)
      },
      onSuccess: (user) => {
        queryClient.setQueryData(AUTH_QUERY_KEY, user)
        router.replace((config.homePath ?? '/(app)/') as never)
      },
    })
  }

  // ── Account management hooks ───────────────────────────────────────────────

  function useForgotPassword() {
    return useMutation<void, Error, { email: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.forgotPassword, body, { skipAuth: true }),
    })
  }

  function useResetPassword() {
    return useMutation<void, Error, { token: string; password: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.resetPassword, body, { skipAuth: true }),
    })
  }

  function useVerifyEmail() {
    return useMutation<void, Error, { token: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.verifyEmail, body),
    })
  }

  function useResendVerification() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>(contract.endpoints.resendVerification, {}),
    })
  }

  function useSetPassword() {
    return useMutation<void, Error, { currentPassword: string; newPassword: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.setPassword, body),
    })
  }

  function useSessions() {
    return useQuery<SessionInfo[]>({
      queryKey: SESSIONS_QUERY_KEY,
      queryFn: () => api.get<SessionInfo[]>(contract.endpoints.sessions),
    })
  }

  function useRevokeSession() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: (sessionId) => api.delete<void>(contract.sessionRevoke(sessionId)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
      },
    })
  }

  function useDeleteAccount() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, void>({
      mutationFn: () => api.delete<void>(contract.endpoints.deleteAccount),
      onSuccess: async () => {
        await tokenStorage.clearToken()
        await tokenStorage.clearRefreshToken()
        queryClient.clear()
      },
    })
  }

  function useCancelDeletion() {
    return useMutation<void, Error, { token: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.cancelDeletion, body),
    })
  }

  // ── MFA hooks ──────────────────────────────────────────────────────────────

  function useMfaSetup() {
    return useMutation<MfaSetupResult, Error, void>({
      mutationFn: () => api.post<MfaSetupResult>(contract.endpoints.mfaSetup, {}),
    })
  }

  function useMfaVerifySetup() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.mfaVerifySetup, body),
    })
  }

  function useMfaDisable() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.delete<void>(contract.endpoints.mfaDisable, body),
    })
  }

  function useMfaMethods() {
    return useQuery<MfaMethod[]>({
      queryKey: MFA_METHODS_QUERY_KEY,
      queryFn: () => api.get<MfaMethod[]>(contract.endpoints.mfaMethods),
    })
  }

  function useMfaResend() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>(contract.endpoints.mfaResend, {}),
    })
  }

  function useEmailOtpEnable() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>(contract.endpoints.mfaEmailOtpEnable, {}),
    })
  }

  function useEmailOtpVerifySetup() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.mfaEmailOtpVerifySetup, body),
    })
  }

  function useMfaEmailOtpDisable() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.delete<void>(contract.endpoints.mfaEmailOtpDisable),
    })
  }

  // ── OAuth helpers ──────────────────────────────────────────────────────────

  function getOAuthUrl(provider: string, redirectUri: string): string {
    return `${contract.oauthUrl(provider)}?redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  function getLinkUrl(provider: string): string {
    return contract.oauthLinkUrl(provider)
  }

  function useOAuthUnlink() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: (provider) => api.delete<void>(contract.oauthUnlink(provider)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
      },
    })
  }

  // ── Return all hooks ───────────────────────────────────────────────────────

  return {
    // Core auth
    useUser,
    useLogin,
    useRegister,
    useLogout,
    useVerifyMfa,
    useExchangeOAuthCode,
    // Account management
    useForgotPassword,
    useResetPassword,
    useVerifyEmail,
    useResendVerification,
    useSetPassword,
    useSessions,
    useRevokeSession,
    useDeleteAccount,
    useCancelDeletion,
    // MFA
    useMfaSetup,
    useMfaVerifySetup,
    useMfaDisable,
    useMfaMethods,
    useMfaResend,
    useEmailOtpEnable,
    useEmailOtpVerifySetup,
    useMfaEmailOtpDisable,
    // OAuth helpers
    getOAuthUrl,
    getLinkUrl,
    useOAuthUnlink,
  }
}

export type AuthHooks = ReturnType<typeof createAuthHooks>
