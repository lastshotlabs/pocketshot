import type { ApiError } from '../api/client'

export type AuthErrorContext =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'verify-email'

export interface AuthErrorConfig {
  verbose?: boolean
  messages?: Partial<Record<AuthErrorContext, string>>
  format?: (error: ApiError, context: AuthErrorContext) => string
}

const DEFAULT_MESSAGES: Record<AuthErrorContext, string> = {
  login: 'Invalid email or password.',
  register: 'Unable to create account. Please try again.',
  'forgot-password': "If that email is registered, you'll receive a password reset link shortly.",
  'reset-password': 'Unable to reset password. The link may have expired.',
  'verify-email': 'Unable to verify email. The link may have expired or already been used.',
}

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__
}

export function formatAuthError(
  error: ApiError,
  context: AuthErrorContext,
  config?: AuthErrorConfig,
): string {
  if (config?.format) {
    return config.format(error, context)
  }

  const verbose = config?.verbose ?? isDev()
  if (verbose) {
    return error.message ?? DEFAULT_MESSAGES[context]
  }

  return config?.messages?.[context] ?? DEFAULT_MESSAGES[context]
}

export function createAuthErrorFormatter(config?: AuthErrorConfig) {
  return (error: ApiError, context: AuthErrorContext): string =>
    formatAuthError(error, context, config)
}
