import { useQuery, useMutation } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import type { QueryClient } from '@tanstack/react-query'
import type { PocketshotConfig } from '../create-pocketshot'
import type { PocketshotAuthContract } from './contract'
import type { MfaMethod, MfaSetupResult } from './hooks'

export type { MfaMethod, MfaSetupResult }

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A set of MFA recovery codes for the authenticated user.
 */
export interface MfaRecoveryCodes {
  /** The list of one-time recovery codes. */
  codes: string[]
  /** ISO-8601 timestamp of when the codes were last generated. */
  generatedAt: string
}

// ── Query keys ────────────────────────────────────────────────────────────────

const MFA_METHODS_QUERY_KEY = ['mfa', 'methods'] as const
const MFA_RECOVERY_CODES_QUERY_KEY = ['mfa', 'recovery-codes'] as const

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates all MFA-related hooks bound to the provided API client and contract.
 * Covers TOTP setup/disable, email OTP, MFA verification during login, and recovery codes.
 *
 * @param opts - Shared SDK dependencies
 */
export function createMfaHooks(opts: {
  api: ApiClient
  queryClient: QueryClient
  config: PocketshotConfig
  contract: PocketshotAuthContract
}) {
  const { api, contract } = opts

  // ── useMfaMethods ──────────────────────────────────────────────────────────

  /**
   * Queries the list of MFA methods configured for the authenticated user.
   */
  function useMfaMethods() {
    return useQuery<MfaMethod[]>({
      queryKey: MFA_METHODS_QUERY_KEY,
      queryFn: () => api.get<MfaMethod[]>(contract.endpoints.mfaMethods),
    })
  }

  // ── useMfaSetup ────────────────────────────────────────────────────────────

  /**
   * Initiates TOTP MFA setup, returning the secret, QR code URL, and initial recovery codes.
   */
  function useMfaSetup() {
    return useMutation<MfaSetupResult, Error, void>({
      mutationFn: () => api.post<MfaSetupResult>(contract.endpoints.mfaSetup, {}),
    })
  }

  // ── useMfaVerifySetup ──────────────────────────────────────────────────────

  /**
   * Confirms TOTP setup by submitting a valid code generated from the secret.
   */
  function useMfaVerifySetup() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.mfaVerifySetup, body),
    })
  }

  // ── useMfaDisable ──────────────────────────────────────────────────────────

  /**
   * Disables TOTP MFA for the authenticated user. Requires a valid current TOTP code.
   */
  function useMfaDisable() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.delete<void>(contract.endpoints.mfaDisable, body),
    })
  }

  // ── useMfaResend ───────────────────────────────────────────────────────────

  /**
   * Re-sends the MFA code during a pending MFA challenge (e.g. email OTP).
   */
  function useMfaResend() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>(contract.endpoints.mfaResend, {}),
    })
  }

  // ── useMfaRecoveryCodes ────────────────────────────────────────────────────

  /**
   * Queries the authenticated user's MFA recovery codes.
   * These codes can be used to log in when other MFA methods are unavailable.
   */
  function useMfaRecoveryCodes() {
    return useQuery<MfaRecoveryCodes>({
      queryKey: MFA_RECOVERY_CODES_QUERY_KEY,
      queryFn: () => api.get<MfaRecoveryCodes>(contract.endpoints.mfaRecoveryCodes),
    })
  }

  // ── useEmailOtpEnable ──────────────────────────────────────────────────────

  /**
   * Initiates email OTP as a second factor. Sends a verification code to the user's email.
   */
  function useEmailOtpEnable() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>(contract.endpoints.mfaEmailOtpEnable, {}),
    })
  }

  // ── useEmailOtpVerifySetup ─────────────────────────────────────────────────

  /**
   * Confirms email OTP setup by submitting the code sent to the user's email.
   */
  function useEmailOtpVerifySetup() {
    return useMutation<void, Error, { code: string }>({
      mutationFn: (body) => api.post<void>(contract.endpoints.mfaEmailOtpVerifySetup, body),
    })
  }

  // ── useMfaEmailOtpDisable ──────────────────────────────────────────────────

  /**
   * Disables email OTP as an MFA factor for the authenticated user.
   */
  function useMfaEmailOtpDisable() {
    return useMutation<void, Error, void>({
      mutationFn: () => api.delete<void>(contract.endpoints.mfaEmailOtpDisable),
    })
  }

  return {
    useMfaMethods,
    useMfaSetup,
    useMfaVerifySetup,
    useMfaDisable,
    useMfaResend,
    useMfaRecoveryCodes,
    useEmailOtpEnable,
    useEmailOtpVerifySetup,
    useMfaEmailOtpDisable,
  }
}

/** Type of the object returned by {@link createMfaHooks}. */
export type MfaHooks = ReturnType<typeof createMfaHooks>
