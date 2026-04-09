import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { atom, useAtom } from 'jotai'
import type { ApiClient } from '../api/client'
import type { TokenStorage } from './storage'
import type { QueryClient } from '@tanstack/react-query'
import type { PocketshotConfig } from '../create-pocketshot'
import type { PocketshotAuthContract } from './contract'
import { createAccountHooks } from './account-hooks'
import { createMfaHooks } from './mfa-hooks'
import { createOAuthHooks } from './oauth-hooks'
import { createWebAuthnHooks } from './webauthn-hooks'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Profile of the currently authenticated user. */
export interface AuthUser {
  id: string
  email?: string
  username?: string
  roles?: string[]
  emailVerified?: boolean
  [key: string]: unknown
}

/** Pending MFA challenge returned when a login attempt requires a second factor. */
export interface MfaChallenge {
  mfaToken: string
  mfaMethods: string[]
}

/** Raw response from the login endpoint. */
export interface LoginResult {
  token?: string
  mfaRequired?: boolean
  mfaToken?: string
  mfaMethods?: string[]
}

/** A single active session for the authenticated user. */
export interface SessionInfo {
  sessionId: string
  ip?: string
  userAgent?: string
  createdAt: string
  lastActiveAt?: string
}

/** A configured MFA factor on the user's account. */
export interface MfaMethod {
  type: 'totp' | 'email_otp' | 'webauthn'
  enabled: boolean
}

/** Result of initiating TOTP MFA setup. */
export interface MfaSetupResult {
  secret: string
  qrCodeUrl: string
  recoveryCodes: string[]
}

// ── Shared query key ──────────────────────────────────────────────────────────

const AUTH_QUERY_KEY = ['auth', 'me'] as const

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates all auth hooks, bound to the provided API client, token storage, query
 * client, config, and contract. The returned object is spread into the top-level
 * Pocketshot instance by `createPocketshot`.
 *
 * The factory is split into focused sub-factories internally but exposes a single
 * flat object so consumers keep one import point.
 *
 * @param opts - Shared SDK dependencies.
 */
export function createAuthHooks(opts: {
  api: ApiClient
  tokenStorage: TokenStorage
  queryClient: QueryClient
  config: PocketshotConfig
  contract: PocketshotAuthContract
}) {
  const { api, tokenStorage, config, contract } = opts

  // Shared MFA pending state — kept here so useLogin and useVerifyMfa (now in
  // mfa-hooks) can share the same atom instance via closure.
  const pendingMfaChallengeAtom = atom<MfaChallenge | null>(null)

  // ── useUser ────────────────────────────────────────────────────────────────

  /**
   * Queries the authenticated user's profile. Returns `null` when the user is
   * not logged in rather than throwing.
   */
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

  /**
   * Submits email/password credentials. On success, either stores the token and
   * navigates to the home route, or stores the MFA challenge and navigates to the
   * MFA route when a second factor is required.
   */
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

  /**
   * Registers a new user account, stores the returned tokens, and navigates to
   * the home route on success.
   */
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

  /**
   * Signs the current user out: calls the server logout endpoint (best-effort),
   * clears all local tokens, clears the query cache, and navigates to the login route.
   */
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

  // ── useForgotPassword ──────────────────────────────────────────────────────

  /**
   * Sends a password-reset email to the supplied address.
   * Does not require an active session.
   */
  function useForgotPassword() {
    return useMutation<void, Error, { email: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.forgotPassword, body, { skipAuth: true }),
    })
  }

  // ── Compose sub-factories ──────────────────────────────────────────────────

  const accountHooks = createAccountHooks(opts)
  const mfaHooks = createMfaHooks({ ...opts, pendingMfaChallengeAtom })
  const oauthHooks = createOAuthHooks(opts)
  const webauthnHooks = createWebAuthnHooks(opts)

  return {
    // Core auth
    useUser,
    useLogin,
    useRegister,
    useLogout,
    useForgotPassword,
    // Account management
    ...accountHooks,
    // MFA
    ...mfaHooks,
    // OAuth
    ...oauthHooks,
    // WebAuthn / passkeys
    ...webauthnHooks,
  }
}

/** Type of the object returned by {@link createAuthHooks}. */
export type AuthHooks = ReturnType<typeof createAuthHooks>
