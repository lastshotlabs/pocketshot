import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import type { ApiClient } from '../api/client'
import type { TokenStorage } from './storage'
import type { QueryClient } from '@tanstack/react-query'
import type { PocketshotConfig } from '../create-pocketshot'
import type { PocketshotAuthContract } from './contract'
import type { AuthUser } from './hooks'

// ── Query keys ────────────────────────────────────────────────────────────────

const AUTH_QUERY_KEY = ['auth', 'me'] as const

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates OAuth/social-login hooks and helpers bound to the provided API client and contract.
 * Covers authorization URL generation, OAuth code exchange, account linking, and unlinking.
 *
 * @param opts - Shared SDK dependencies
 */
export function createOAuthHooks(opts: {
  api: ApiClient
  tokenStorage: TokenStorage
  queryClient: QueryClient
  config: PocketshotConfig
  contract: PocketshotAuthContract
}) {
  const { api, tokenStorage, config, contract } = opts

  // ── getOAuthUrl ────────────────────────────────────────────────────────────

  /**
   * Returns the full authorization URL for the given OAuth provider.
   * Appends the redirect URI as a query parameter.
   *
   * @param provider   - OAuth provider identifier, e.g. `"google"` or `"github"`.
   * @param redirectUri - The URI the provider should redirect to after authorization.
   */
  function getOAuthUrl(provider: string, redirectUri: string): string {
    return `${contract.oauthUrl(provider)}?redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  // ── getLinkUrl ─────────────────────────────────────────────────────────────

  /**
   * Returns the URL used to initiate OAuth account linking for the given provider.
   *
   * @param provider - OAuth provider identifier.
   */
  function getLinkUrl(provider: string): string {
    return contract.oauthLinkUrl(provider)
  }

  // ── useOAuthExchange ───────────────────────────────────────────────────────

  /**
   * Exchanges an OAuth authorization code for an access token, stores it,
   * fetches the user profile, and navigates to the home route.
   *
   * Previously named `useExchangeOAuthCode` — the old name is exported as a
   * deprecated alias from `hooks.ts` for backward compatibility.
   */
  function useOAuthExchange() {
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

  // ── useLinkAccount ─────────────────────────────────────────────────────────

  /**
   * Links a social/OAuth account to the currently authenticated session.
   * POSTs the authorization code to `/auth/oauth/:provider/link` and invalidates
   * the auth query so `useUser` re-fetches the updated profile.
   */
  function useLinkAccount() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { provider: string; code: string }>({
      mutationFn: ({ provider, code }) =>
        api.post<void>(contract.oauthLinkUrl(provider), { code }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
      },
    })
  }

  // ── useUnlinkAccount ───────────────────────────────────────────────────────

  /**
   * Unlinks a social/OAuth account from the authenticated user's profile.
   * Invalidates the auth query after a successful unlink.
   *
   * Previously named `useOAuthUnlink` — the old name is exported as a
   * deprecated alias from `hooks.ts` for backward compatibility.
   *
   * @param provider - OAuth provider identifier to unlink.
   */
  function useUnlinkAccount() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: (provider) => api.delete<void>(contract.oauthUnlink(provider)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
      },
    })
  }

  return {
    getOAuthUrl,
    getLinkUrl,
    useOAuthExchange,
    useLinkAccount,
    useUnlinkAccount,
    // Deprecated aliases — do not remove until next major version
    /** @deprecated Use `useOAuthExchange` instead. */
    useExchangeOAuthCode: useOAuthExchange,
    /** @deprecated Use `useUnlinkAccount` instead. */
    useOAuthUnlink: useUnlinkAccount,
  }
}

/** Type of the object returned by {@link createOAuthHooks}. */
export type OAuthHooks = ReturnType<typeof createOAuthHooks>
