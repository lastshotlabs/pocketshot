import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { atom, useAtom } from 'jotai'
import type { ApiClient } from '../api/client'
import type { TokenStorage } from './storage'
import type { QueryClient } from '@tanstack/react-query'
import type { PocketshotConfig } from '../create-pocketshot'

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
}) {
  const { api, tokenStorage, config } = opts

  // Internal MFA pending state atom — not exported to consumers
  const pendingMfaChallengeAtom = atom<MfaChallenge | null>(null)

  // ── useUser ────────────────────────────────────────────────────────────────

  function useUser() {
    const { data: user = null, isLoading, isError } = useQuery<AuthUser | null>({
      queryKey: AUTH_QUERY_KEY,
      queryFn: async () => {
        try {
          return await api.get<AuthUser>('/auth/me')
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
        const res = await api.post<LoginResult>('/auth/login', { email, password }, { skipAuth: true })

        if (res.mfaRequired && res.mfaToken) {
          return { mfaToken: res.mfaToken, mfaMethods: res.mfaMethods ?? [] } as MfaChallenge
        }

        if (res.token) {
          await tokenStorage.setToken(res.token)
        }
        return api.get<AuthUser>('/auth/me')
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
          '/auth/register',
          body,
          { skipAuth: true },
        )
        if (typeof res.token === 'string') {
          await tokenStorage.setToken(res.token)
        }
        if (typeof res.refreshToken === 'string') {
          await tokenStorage.setRefreshToken(res.refreshToken)
        }
        return api.get<AuthUser>('/auth/me')
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
        await api.post('/auth/logout', {}).catch(() => {})
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
          '/auth/mfa/verify',
          { mfaToken, code, method },
          { skipAuth: true },
        )
        await tokenStorage.setToken(res.token)
        if (res.refreshToken) {
          await tokenStorage.setRefreshToken(res.refreshToken)
        }
        return api.get<AuthUser>('/auth/me')
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
          '/auth/oauth/exchange',
          { code },
          { skipAuth: true },
        )
        await tokenStorage.setToken(res.token)
        if (res.refreshToken) {
          await tokenStorage.setRefreshToken(res.refreshToken)
        }
        return api.get<AuthUser>('/auth/me')
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
      mutationFn: (body) => api.post<void>('/auth/forgot-password', body, { skipAuth: true }),
    })
  }

  function useResetPassword() {
    return useMutation<void, Error, { token: string; password: string }>({
      mutationFn: (body) => api.post<void>('/auth/reset-password', body, { skipAuth: true }),
    })
  }

  function useVerifyEmail() {
    return useMutation<void, Error, { token: string }>({
      mutationFn: (body) => api.post<void>('/auth/verify-email', body),
    })
  }

  function useResendVerification() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>('/auth/resend-verification', {}),
    })
  }

  function useSetPassword() {
    return useMutation<void, Error, { currentPassword: string; newPassword: string }>({
      mutationFn: (body) => api.post<void>('/auth/set-password', body),
    })
  }

  function useSessions() {
    return useQuery<SessionInfo[]>({
      queryKey: SESSIONS_QUERY_KEY,
      queryFn: () => api.get<SessionInfo[]>('/auth/sessions'),
    })
  }

  function useRevokeSession() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { sessionId: string }>({
      mutationFn: (body) => api.delete<void>('/auth/sessions', body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
      },
    })
  }

  function useDeleteAccount() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, void>({
      mutationFn: () => api.delete<void>('/auth/me'),
      onSuccess: async () => {
        await tokenStorage.clearToken()
        await tokenStorage.clearRefreshToken()
        queryClient.clear()
      },
    })
  }

  function useCancelDeletion() {
    return useMutation<void, Error, { token: string }>({
      mutationFn: (body) => api.post<void>('/auth/cancel-deletion', body),
    })
  }

  // ── MFA hooks ──────────────────────────────────────────────────────────────

  function useMfaSetup() {
    return useMutation<MfaSetupResult, Error, void>({
      mutationFn: () => api.post<MfaSetupResult>('/auth/mfa/setup', {}),
    })
  }

  function useMfaVerifySetup() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.post<void>('/auth/mfa/verify-setup', body),
    })
  }

  function useMfaDisable() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.delete<void>('/auth/mfa', body),
    })
  }

  function useMfaMethods() {
    return useQuery<MfaMethod[]>({
      queryKey: MFA_METHODS_QUERY_KEY,
      queryFn: () => api.get<MfaMethod[]>('/auth/mfa/methods'),
    })
  }

  function useMfaResend() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>('/auth/mfa/resend', {}),
    })
  }

  function useEmailOtpEnable() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>('/auth/mfa/email-otp/enable', {}),
    })
  }

  function useEmailOtpVerifySetup() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.post<void>('/auth/mfa/email-otp/verify-setup', body),
    })
  }

  // ── OAuth helper ───────────────────────────────────────────────────────────

  function getOAuthUrl(provider: string, redirectUri: string): string {
    return `${config.apiUrl}/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`
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
    // OAuth helper
    getOAuthUrl,
  }
}

export type AuthHooks = ReturnType<typeof createAuthHooks>
