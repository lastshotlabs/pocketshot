import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import type { TokenStorage } from './storage'
import type { QueryClient } from '@tanstack/react-query'
import type { PocketshotConfig } from '../create-pocketshot'
import type { PocketshotAuthContract } from './contract'
import type { AuthUser } from './hooks'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A passkey credential registered to the authenticated user's account.
 */
export interface PasskeyCredential {
  /** Pocketshot-assigned credential identifier. */
  id: string
  /** The WebAuthn credential ID as returned by the authenticator. */
  credentialId: string
  /** Optional human-readable label assigned during registration. */
  name?: string
  /** ISO-8601 timestamp of when the credential was registered. */
  createdAt: string
  /** ISO-8601 timestamp of the most recent use, if any. */
  lastUsedAt?: string
  /** The platform on which the credential was created. */
  platform: 'ios' | 'android'
}

/**
 * Variables accepted by {@link createWebAuthnHooks.usePasskeyRegister}.
 */
export interface PasskeyRegisterVars {
  /** Optional human-readable label for the new passkey. */
  name?: string
}

/**
 * Variables accepted by {@link createWebAuthnHooks.usePasskeyLogin}.
 */
export interface PasskeyLoginVars {
  /** Optional username hint passed to the authenticator. */
  username?: string
}

// ── Query keys ────────────────────────────────────────────────────────────────

const PASSKEYS_QUERY_KEY = ['passkeys'] as const
const AUTH_QUERY_KEY = ['auth', 'me'] as const

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates WebAuthn / passkey hooks bound to the provided API client and contract.
 *
 * All hooks that call the native authenticator require the optional peer dependency
 * `react-native-passkeys`. If the package is not installed the hook will throw a
 * descriptive error at call time rather than at module load time, so that apps that
 * do not use passkeys are not penalized.
 *
 * @param opts - Shared SDK dependencies
 */
export function createWebAuthnHooks(opts: {
  api: ApiClient
  tokenStorage: TokenStorage
  queryClient: QueryClient
  config: PocketshotConfig
  contract: PocketshotAuthContract
}) {
  const { api, tokenStorage, contract } = opts

  // ── usePasskeyRegister ─────────────────────────────────────────────────────

  /**
   * Registers a new passkey for the authenticated user.
   *
   * Fetches registration options from the server, invokes the native authenticator
   * via `react-native-passkeys`, and posts the resulting credential back for
   * server-side verification.
   *
   * Requires `react-native-passkeys` to be installed:
   * ```sh
   * npx expo install react-native-passkeys
   * ```
   */
  function usePasskeyRegister() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, PasskeyRegisterVars>({
      mutationFn: async ({ name } = {}) => {
        let Passkey: any
        try {
          Passkey = require('react-native-passkeys').default
        } catch {
          throw new Error(
            '[pocketshot] usePasskeyRegister() requires react-native-passkeys.\n' +
            'Install it: npx expo install react-native-passkeys',
          )
        }
        const options = await api.get<any>(contract.passkey.registerOptions, { skipAuth: false })
        const result = await Passkey.create(options)
        await api.post<void>(contract.passkey.registerVerify, { credential: result, name })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })
      },
    })
  }

  // ── usePasskeyLogin ────────────────────────────────────────────────────────

  /**
   * Authenticates the user with an existing passkey.
   *
   * Fetches authentication options from the server, invokes the native authenticator
   * via `react-native-passkeys`, posts the assertion for server verification, and
   * stores the returned token.
   *
   * Requires `react-native-passkeys` to be installed:
   * ```sh
   * npx expo install react-native-passkeys
   * ```
   */
  function usePasskeyLogin() {
    const queryClient = useQueryClient()
    return useMutation<AuthUser, Error, PasskeyLoginVars>({
      mutationFn: async ({ username } = {}) => {
        let Passkey: any
        try {
          Passkey = require('react-native-passkeys').default
        } catch {
          throw new Error(
            '[pocketshot] usePasskeyLogin() requires react-native-passkeys.\n' +
            'Install it: npx expo install react-native-passkeys',
          )
        }
        const loginOptionsPath = username
          ? `${contract.passkey.loginOptions}?username=${encodeURIComponent(username)}`
          : contract.passkey.loginOptions
        const options = await api.get<any>(loginOptionsPath, { skipAuth: true })
        const assertion = await Passkey.get(options)
        const res = await api.post<{ token: string; refreshToken?: string }>(
          contract.passkey.loginVerify,
          { credential: assertion },
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
      },
    })
  }

  // ── useListPasskeys ────────────────────────────────────────────────────────

  /**
   * Queries all passkeys registered for the authenticated user.
   */
  function useListPasskeys() {
    return useQuery<PasskeyCredential[]>({
      queryKey: PASSKEYS_QUERY_KEY,
      queryFn: () => api.get<PasskeyCredential[]>(contract.passkey.list),
    })
  }

  // ── useDeletePasskey ───────────────────────────────────────────────────────

  /**
   * Deletes a registered passkey by credential ID.
   * Invalidates the passkeys list query on success.
   */
  function useDeletePasskey() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { credentialId: string }>({
      mutationFn: ({ credentialId }) => api.delete<void>(contract.passkey.delete(credentialId)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })
      },
    })
  }

  return {
    usePasskeyRegister,
    usePasskeyLogin,
    useListPasskeys,
    useDeletePasskey,
  }
}

/** Type of the object returned by {@link createWebAuthnHooks}. */
export type WebAuthnHooks = ReturnType<typeof createWebAuthnHooks>
