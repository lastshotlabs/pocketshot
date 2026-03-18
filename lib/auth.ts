import { apiPost } from './api'
import { setTokens, clearTokens } from './tokenStorage'

export interface AuthResult {
  token: string
  refreshToken?: string
  userId: string
}

export interface MfaChallenge {
  mfaRequired: true
  mfaToken: string
  mfaMethods: string[]
}

export async function register(email: string, password: string): Promise<AuthResult> {
  const data = await apiPost<AuthResult>('/auth/register', { email, password }, { skipAuth: true })
  await setTokens(data.token, data.refreshToken)
  return data
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult | MfaChallenge> {
  const data = await apiPost<AuthResult | MfaChallenge>('/auth/login', { email, password }, { skipAuth: true })
  if ('mfaRequired' in data && data.mfaRequired) return data
  await setTokens((data as AuthResult).token, (data as AuthResult).refreshToken)
  return data as AuthResult
}

export async function verifyMfa(
  mfaToken: string,
  code: string,
  method: string
): Promise<AuthResult> {
  const data = await apiPost<AuthResult>('/auth/mfa/verify', { mfaToken, code, method }, { skipAuth: true })
  await setTokens(data.token, data.refreshToken)
  return data
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout', {}).catch(() => {})
  await clearTokens()
}

export async function exchangeOAuthCode(code: string): Promise<AuthResult> {
  const data = await apiPost<AuthResult>('/auth/oauth/exchange', { code }, { skipAuth: true })
  await setTokens(data.token, data.refreshToken)
  return data
}
