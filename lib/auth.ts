import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useSetAtom, useAtomValue } from 'jotai'
import type { WritableAtom } from 'jotai'
import type { ApiClient } from './api'
import type { TokenStorage } from './tokenStorage'
import { tokenStorage as defaultStorage, } from './tokenStorage'
import { api as defaultApi } from './api'
import { pendingMfaChallengeAtom } from './atoms'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  [key: string]: unknown
}

export type MfaMethod = 'totp' | 'emailOtp' | 'webauthn'

export interface LoginResponse {
  token: string
  userId: string
  refreshToken?: string
  mfaRequired?: boolean
  mfaToken?: string
  mfaMethods?: MfaMethod[]
}

export interface MfaChallenge {
  mfaToken: string
  mfaMethods: MfaMethod[]
}

export type LoginResult = AuthUser | MfaChallenge

export interface AuthResult {
  token: string
  refreshToken?: string
  userId: string
}

export function isMfaChallenge(result: LoginResult): result is MfaChallenge {
  return 'mfaToken' in result && !('id' in result)
}

// ── Factory ────────────────────────────────────────────────────────────────────

const AUTH_QUERY_KEY = ['auth', 'me'] as const

interface AuthHooksOptions {
  api: ApiClient
  storage: TokenStorage
  pendingMfaChallengeAtom: WritableAtom<MfaChallenge | null, [MfaChallenge | null], void>
}

export function createAuthHooks({ api, storage, pendingMfaChallengeAtom }: AuthHooksOptions) {
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
      staleTime: 5 * 60 * 1000,
      retry: false,
    })
    return { user, isLoading, isError }
  }

  function useLogin() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const setMfaChallenge = useSetAtom(pendingMfaChallengeAtom)

    return useMutation<LoginResult, Error, { email: string; password: string }>({
      mutationFn: async ({ email, password }) => {
        const res = await api.post<LoginResponse>('/auth/login', { email, password }, { skipAuth: true })

        if (res.mfaRequired) {
          return { mfaToken: res.mfaToken!, mfaMethods: res.mfaMethods ?? [] } satisfies MfaChallenge
        }

        if (res.token) await storage.set(res.token)
        if (res.refreshToken) await storage.setRefreshToken(res.refreshToken)

        return api.get<AuthUser>('/auth/me')
      },
      onSuccess: (result) => {
        if (isMfaChallenge(result)) {
          setMfaChallenge(result)
          router.replace('/(auth)/mfa')
          return
        }
        queryClient.setQueryData(AUTH_QUERY_KEY, result)
        router.replace('/(app)/')
      },
    })
  }

  function useRegister() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation<AuthUser, Error, { email: string; password: string }>({
      mutationFn: async ({ email, password }) => {
        const res = await api.post<Record<string, unknown>>('/auth/register', { email, password }, { skipAuth: true })
        if (typeof res['token'] === 'string') await storage.set(res['token'])
        if (typeof res['refreshToken'] === 'string') await storage.setRefreshToken(res['refreshToken'])
        return api.get<AuthUser>('/auth/me')
      },
      onSuccess: (user) => {
        queryClient.setQueryData(AUTH_QUERY_KEY, user)
        router.replace('/(app)/')
      },
    })
  }

  function useLogout() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const setMfaChallenge = useSetAtom(pendingMfaChallengeAtom)

    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>('/auth/logout', {}).catch(() => {}),
      onSuccess: async () => {
        setMfaChallenge(null)
        await storage.clear()
        await storage.clearRefreshToken()
        queryClient.clear()
        router.replace('/(auth)/login')
      },
    })
  }

  function useVerifyMfa() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const setMfaChallenge = useSetAtom(pendingMfaChallengeAtom)
    const mfaChallenge = useAtomValue(pendingMfaChallengeAtom)

    return useMutation<AuthUser, Error, { code: string; method?: string }>({
      mutationFn: async ({ code, method }) => {
        if (!mfaChallenge) throw new Error('No pending MFA challenge')
        const data = await api.post<AuthResult>('/auth/mfa/verify', {
          mfaToken: mfaChallenge.mfaToken,
          code,
          method: method ?? mfaChallenge.mfaMethods[0],
        }, { skipAuth: true })
        if (data.token) await storage.set(data.token)
        if (data.refreshToken) await storage.setRefreshToken(data.refreshToken)
        return api.get<AuthUser>('/auth/me')
      },
      onSuccess: (user) => {
        setMfaChallenge(null)
        queryClient.setQueryData(AUTH_QUERY_KEY, user)
        router.replace('/(app)/')
      },
    })
  }

  function useExchangeOAuthCode() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation<AuthUser, Error, { code: string }>({
      mutationFn: async ({ code }) => {
        const data = await api.post<AuthResult>('/auth/oauth/exchange', { code }, { skipAuth: true })
        if (data.token) await storage.set(data.token)
        if (data.refreshToken) await storage.setRefreshToken(data.refreshToken)
        return api.get<AuthUser>('/auth/me')
      },
      onSuccess: (user) => {
        queryClient.setQueryData(AUTH_QUERY_KEY, user)
        router.replace('/(app)/')
      },
    })
  }

  return { useUser, useLogin, useRegister, useLogout, useVerifyMfa, useExchangeOAuthCode }
}

// ── Default instance ───────────────────────────────────────────────────────────

export const {
  useUser,
  useLogin,
  useRegister,
  useLogout,
  useVerifyMfa,
  useExchangeOAuthCode,
} = createAuthHooks({
  api: defaultApi,
  storage: defaultStorage,
  pendingMfaChallengeAtom,
})
