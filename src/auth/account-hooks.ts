import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import type { TokenStorage } from './storage'
import type { QueryClient } from '@tanstack/react-query'
import type { PocketshotConfig } from '../create-pocketshot'
import type { PocketshotAuthContract } from './contract'
import type { SessionInfo } from './hooks'

// ── Query keys ────────────────────────────────────────────────────────────────

const SESSIONS_QUERY_KEY = ['sessions'] as const

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates account-management hooks bound to the provided API client and contract.
 * Covers password management, email verification, session control, and account deletion.
 *
 * @param opts - Shared SDK dependencies
 */
export function createAccountHooks(opts: {
  api: ApiClient
  tokenStorage: TokenStorage
  queryClient: QueryClient
  config: PocketshotConfig
  contract: PocketshotAuthContract
}) {
  const { api, tokenStorage, contract } = opts

  // ── useResetPassword ───────────────────────────────────────────────────────

  /**
   * Submits a password-reset token and new password.
   * Does not require an active session.
   */
  function useResetPassword() {
    return useMutation<void, Error, { token: string; password: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.resetPassword, body, { skipAuth: true }),
    })
  }

  // ── useVerifyEmail ─────────────────────────────────────────────────────────

  /**
   * Verifies a user's email address using the token sent to their inbox.
   */
  function useVerifyEmail() {
    return useMutation<void, Error, { token: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.verifyEmail, body),
    })
  }

  // ── useResendVerification ──────────────────────────────────────────────────

  /**
   * Re-sends the email verification link to the authenticated user's email address.
   */
  function useResendVerification() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>(contract.endpoints.resendVerification, {}),
    })
  }

  // ── useSetPassword ─────────────────────────────────────────────────────────

  /**
   * Changes the authenticated user's password. Requires knowing the current password.
   */
  function useSetPassword() {
    return useMutation<void, Error, { currentPassword: string; newPassword: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.setPassword, body),
    })
  }

  // ── useSessions ───────────────────────────────────────────────────────────

  /**
   * Queries the list of active sessions for the authenticated user.
   */
  function useSessions() {
    return useQuery<SessionInfo[]>({
      queryKey: SESSIONS_QUERY_KEY,
      queryFn: () => api.get<SessionInfo[]>(contract.endpoints.sessions),
    })
  }

  // ── useRevokeSession ───────────────────────────────────────────────────────

  /**
   * Revokes a specific session by ID, then invalidates the sessions list.
   */
  function useRevokeSession() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: (sessionId) => api.delete<void>(contract.sessionRevoke(sessionId)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
      },
    })
  }

  // ── useDeleteAccount ───────────────────────────────────────────────────────

  /**
   * Permanently deletes the authenticated user's account and clears all local auth state.
   */
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

  // ── useCancelDeletion ──────────────────────────────────────────────────────

  /**
   * Cancels a pending account deletion request using the token from the deletion email.
   */
  function useCancelDeletion() {
    return useMutation<void, Error, { token: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.cancelDeletion, body),
    })
  }

  return {
    useResetPassword,
    useVerifyEmail,
    useResendVerification,
    useSetPassword,
    useSessions,
    useRevokeSession,
    useDeleteAccount,
    useCancelDeletion,
  }
}

/** Type of the object returned by {@link createAccountHooks}. */
export type AccountHooks = ReturnType<typeof createAccountHooks>
