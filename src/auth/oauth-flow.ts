export interface OAuthTransaction {
  provider: string
  state: string
  verifier: string
  redirectUri: string
  createdAt: number
}

export interface OAuthTransactionStorage {
  get(): Promise<OAuthTransaction | null>
  set(value: OAuthTransaction): Promise<void>
  clear(): Promise<void>
}

export interface OAuthFlowTransport<Result> {
  authorizationUrl(input: {
    provider: string
    redirectUri: string
    state: string
    codeChallenge: string
    codeChallengeMethod: 'S256'
  }): Promise<string> | string
  exchange(input: {
    provider: string
    redirectUri: string
    code: string
    verifier: string
  }): Promise<Result>
}

export type OAuthCallbackResult<Result> =
  | { status: 'complete'; result: Result }
  | { status: 'cancelled'; error: string; description: string | null }

export interface OAuthFlowOptions<Result> {
  allowedProviders: readonly string[]
  /** Custom schemes registered by this app. HTTPS remains allowed. */
  allowedRedirectSchemes?: readonly string[]
  storage: OAuthTransactionStorage
  transport: OAuthFlowTransport<Result>
  createState(): string
  createVerifier(): string
  challenge(verifier: string): Promise<string> | string
  now?: () => number
  ttlMs?: number
}

export class OAuthFlowController<Result> {
  private consumedStates = new Set<string>()
  private readonly now: () => number
  private readonly ttlMs: number

  constructor(private readonly options: OAuthFlowOptions<Result>) {
    this.now = options.now ?? Date.now
    this.ttlMs = options.ttlMs ?? 10 * 60_000
  }

  async begin(provider: string, redirectUri: string): Promise<string> {
    this.requireProvider(provider)
    const uri = new URL(redirectUri)
    const scheme = uri.protocol.slice(0, -1).toLowerCase()
    if (
      scheme !== 'https' &&
      !(this.options.allowedRedirectSchemes ?? [])
        .map((value) => value.toLowerCase())
        .includes(scheme)
    ) {
      throw new Error('[pocketshot] OAuth redirect URI scheme is not allowlisted')
    }
    if (uri.username || uri.password || uri.hash) {
      throw new Error('[pocketshot] OAuth redirect URI contains forbidden components')
    }
    const pending = await this.options.storage.get()
    if (pending && this.now() - pending.createdAt <= this.ttlMs) {
      throw new Error('[pocketshot] OAuth transaction is already pending')
    }
    const state = this.options.createState()
    const verifier = this.options.createVerifier()
    if (state.length < 16 || verifier.length < 43) {
      throw new Error('[pocketshot] OAuth state or PKCE verifier lacks sufficient entropy')
    }
    const transaction: OAuthTransaction = {
      provider,
      state,
      verifier,
      redirectUri: uri.toString(),
      createdAt: this.now(),
    }
    await this.options.storage.set(transaction)
    return this.options.transport.authorizationUrl({
      provider,
      redirectUri: transaction.redirectUri,
      state,
      codeChallenge: await this.options.challenge(verifier),
      codeChallengeMethod: 'S256',
    })
  }

  async complete(input: {
    provider: string
    state: string | null
    code: string | null
    error?: string | null
    errorDescription?: string | null
  }): Promise<OAuthCallbackResult<Result>> {
    this.requireProvider(input.provider)
    const transaction = await this.options.storage.get()
    if (!transaction) throw new Error('[pocketshot] OAuth callback has no pending transaction')
    if (this.consumedStates.has(transaction.state)) {
      throw new Error('[pocketshot] OAuth callback was already consumed')
    }
    if (this.now() - transaction.createdAt > this.ttlMs) {
      await this.options.storage.clear()
      throw new Error('[pocketshot] OAuth transaction expired')
    }
    if (
      transaction.provider !== input.provider ||
      !input.state ||
      input.state !== transaction.state
    ) {
      throw new Error('[pocketshot] OAuth callback state or provider does not match')
    }
    this.consumedStates.add(transaction.state)
    while (this.consumedStates.size > 100) {
      const oldest = this.consumedStates.values().next().value as string | undefined
      if (oldest === undefined) break
      this.consumedStates.delete(oldest)
    }
    await this.options.storage.clear()
    if (input.error) {
      const error = input.error.trim().slice(0, 64)
      if (!/^[a-z0-9_.-]+$/i.test(error)) {
        throw new Error('[pocketshot] OAuth callback error code is invalid')
      }
      return {
        status: 'cancelled',
        error,
        description: input.errorDescription?.trim().slice(0, 256) || null,
      }
    }
    if (!input.code?.trim()) throw new Error('[pocketshot] OAuth callback is missing its code')
    return {
      status: 'complete',
      result: await this.options.transport.exchange({
        provider: transaction.provider,
        redirectUri: transaction.redirectUri,
        code: input.code,
        verifier: transaction.verifier,
      }),
    }
  }

  async cancel(): Promise<void> {
    await this.options.storage.clear()
  }

  private requireProvider(provider: string): void {
    if (!this.options.allowedProviders.includes(provider)) {
      throw new Error(`[pocketshot] Unsupported OAuth provider: ${provider}`)
    }
  }
}

export function createMemoryOAuthTransactionStorage(): OAuthTransactionStorage {
  let value: OAuthTransaction | null = null
  return {
    get: async () => (value ? structuredClone(value) : null),
    set: async (next) => {
      value = structuredClone(next)
    },
    clear: async () => {
      value = null
    },
  }
}
