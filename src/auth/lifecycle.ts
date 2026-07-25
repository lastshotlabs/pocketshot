import type { TokenStorage } from './storage'

export type AccountAuthStatus =
  | 'anonymous'
  | 'registering'
  | 'verification-required'
  | 'authenticating'
  | 'authenticated'
  | 'recovering'
  | 'error'

export interface AccountIdentity {
  id: string
  email: string
  emailVerified: boolean
  displayName?: string
}

export interface AccountAuthSnapshot {
  status: AccountAuthStatus
  user: AccountIdentity | null
  pendingEmail: string | null
  error: string | null
}

export interface AccountAuthResult {
  user: AccountIdentity
  accessToken: string
  refreshToken?: string
}

export interface AccountAuthTransport {
  register(input: {
    email: string
    password: string
    displayName?: string
  }): Promise<{ user: AccountIdentity; verificationRequired: boolean } | AccountAuthResult>
  verifyEmail(input: { email: string; code: string }): Promise<AccountAuthResult>
  login(input: { email: string; password: string }): Promise<AccountAuthResult>
  exchangeOAuth(input: {
    provider: string
    code: string
    redirectUri: string
  }): Promise<AccountAuthResult>
  restore(accessToken: string, refreshToken: string | null): Promise<AccountAuthResult>
  logout(accessToken: string | null): Promise<void>
  forgotPassword(email: string): Promise<void>
  resetPassword(input: { token: string; password: string }): Promise<void>
}

const clone = <T>(value: T): T => structuredClone(value)

export class AccountAuthController {
  private value: AccountAuthSnapshot = {
    status: 'anonymous',
    user: null,
    pendingEmail: null,
    error: null,
  }

  constructor(
    private readonly transport: AccountAuthTransport,
    private readonly storage: TokenStorage,
  ) {}

  get snapshot(): AccountAuthSnapshot {
    return clone(this.value)
  }

  async register(input: { email: string; password: string; displayName?: string }): Promise<void> {
    this.validateCredentials(input.email, input.password)
    this.transition('registering')
    try {
      const result = await this.transport.register({
        ...input,
        email: input.email.trim().toLocaleLowerCase(),
      })
      if ('verificationRequired' in result && result.verificationRequired) {
        this.value = {
          status: 'verification-required',
          user: clone(result.user),
          pendingEmail: result.user.email,
          error: null,
        }
      } else if ('accessToken' in result) {
        await this.accept(result)
      } else {
        this.value = {
          status: 'verification-required',
          user: clone(result.user),
          pendingEmail: result.user.email,
          error: null,
        }
      }
    } catch (error) {
      this.fail(error)
      throw error
    }
  }

  async verifyEmail(code: string): Promise<void> {
    if (!this.value.pendingEmail) throw new Error('No email verification is pending')
    if (!code.trim()) throw new Error('Verification code is required')
    this.transition('authenticating')
    try {
      await this.accept(
        await this.transport.verifyEmail({
          email: this.value.pendingEmail,
          code: code.trim(),
        }),
      )
    } catch (error) {
      this.fail(error)
      throw error
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.validateCredentials(email, password)
    this.transition('authenticating')
    try {
      await this.accept(
        await this.transport.login({
          email: email.trim().toLocaleLowerCase(),
          password,
        }),
      )
    } catch (error) {
      this.fail(error)
      throw error
    }
  }

  async completeOAuth(provider: string, code: string, redirectUri: string): Promise<void> {
    if (!provider || !code || !redirectUri) throw new Error('OAuth return is incomplete')
    this.transition('authenticating')
    try {
      await this.accept(await this.transport.exchangeOAuth({ provider, code, redirectUri }))
    } catch (error) {
      this.fail(error)
      throw error
    }
  }

  async restore(): Promise<boolean> {
    const accessToken = await this.storage.getToken()
    if (!accessToken) {
      this.value = { status: 'anonymous', user: null, pendingEmail: null, error: null }
      return false
    }
    this.transition('authenticating')
    try {
      await this.accept(
        await this.transport.restore(accessToken, await this.storage.getRefreshToken()),
      )
      return true
    } catch {
      await this.clearTokens()
      this.value = { status: 'anonymous', user: null, pendingEmail: null, error: null }
      return false
    }
  }

  async logout(): Promise<void> {
    const token = await this.storage.getToken()
    try {
      await this.transport.logout(token)
    } finally {
      await this.clearTokens()
      this.value = { status: 'anonymous', user: null, pendingEmail: null, error: null }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    if (!email.trim()) throw new Error('Email is required')
    this.transition('recovering')
    try {
      await this.transport.forgotPassword(email.trim().toLocaleLowerCase())
      this.value = {
        status: 'anonymous',
        user: null,
        pendingEmail: email.trim().toLocaleLowerCase(),
        error: null,
      }
    } catch (error) {
      this.fail(error)
      throw error
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    if (!token.trim() || password.length < 8) {
      throw new Error('Reset token and an eight-character password are required')
    }
    this.transition('recovering')
    try {
      await this.transport.resetPassword({ token: token.trim(), password })
      this.value = { status: 'anonymous', user: null, pendingEmail: null, error: null }
    } catch (error) {
      this.fail(error)
      throw error
    }
  }

  private async accept(result: AccountAuthResult): Promise<void> {
    await this.storage.setToken(result.accessToken)
    if (result.refreshToken) await this.storage.setRefreshToken(result.refreshToken)
    else await this.storage.clearRefreshToken()
    this.value = {
      status: 'authenticated',
      user: clone(result.user),
      pendingEmail: null,
      error: null,
    }
  }

  private async clearTokens(): Promise<void> {
    await Promise.all([this.storage.clearToken(), this.storage.clearRefreshToken()])
  }

  private transition(status: AccountAuthStatus): void {
    this.value = { ...this.value, status, error: null }
  }

  private fail(error: unknown): void {
    this.value = {
      ...this.value,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }
  }

  private validateCredentials(email: string, password: string): void {
    if (!email.includes('@') || password.length < 8) {
      throw new Error('A valid email and eight-character password are required')
    }
  }
}
