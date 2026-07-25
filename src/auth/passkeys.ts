import type { AccountAuthResult, AccountIdentity } from './lifecycle'
import type { TokenStorage } from './storage'
import type { PasskeyCredential } from './webauthn-hooks'

export interface PasskeyAuthenticator {
  create(options: unknown): Promise<unknown>
  get(options: unknown): Promise<unknown>
}

export interface PasskeyTransport {
  registrationOptions(): Promise<unknown>
  verifyRegistration(input: {
    credential: unknown
    name?: string
    platform: PasskeyCredential['platform']
  }): Promise<PasskeyCredential>
  loginOptions(username?: string): Promise<unknown>
  verifyLogin(assertion: unknown): Promise<AccountAuthResult>
  list(): Promise<PasskeyCredential[]>
  remove(credentialId: string): Promise<void>
}

export interface PasskeyLifecycleSnapshot {
  status: 'idle' | 'registering' | 'authenticating' | 'authenticated' | 'error'
  credentials: PasskeyCredential[]
  user: AccountIdentity | null
  error: string | null
}

export class PasskeyLifecycleController {
  private value: PasskeyLifecycleSnapshot = {
    status: 'idle',
    credentials: [],
    user: null,
    error: null,
  }

  constructor(
    private readonly transport: PasskeyTransport,
    private readonly authenticator: PasskeyAuthenticator,
    private readonly storage: TokenStorage,
  ) {}

  get snapshot(): PasskeyLifecycleSnapshot {
    return structuredClone(this.value)
  }

  async refresh(): Promise<void> {
    await this.run('idle', async () => {
      this.value.credentials = deduplicateCredentials(await this.transport.list())
    })
  }

  async register(name: string | undefined, platform: PasskeyCredential['platform']): Promise<void> {
    await this.run('registering', async () => {
      const credential = await this.authenticator.create(await this.transport.registrationOptions())
      if (!credential) throw new Error('The authenticator did not create a credential')
      const registered = await this.transport.verifyRegistration({
        credential,
        name: name?.trim() || undefined,
        platform,
      })
      this.value.credentials = deduplicateCredentials([...this.value.credentials, registered])
      this.value.status = 'idle'
    })
  }

  async login(username?: string): Promise<void> {
    await this.run('authenticating', async () => {
      const assertion = await this.authenticator.get(
        await this.transport.loginOptions(username?.trim() || undefined),
      )
      if (!assertion) throw new Error('The authenticator did not return an assertion')
      const result = await this.transport.verifyLogin(assertion)
      await this.storage.setToken(result.accessToken)
      if (result.refreshToken) await this.storage.setRefreshToken(result.refreshToken)
      else await this.storage.clearRefreshToken()
      this.value.user = structuredClone(result.user)
      this.value.status = 'authenticated'
    })
  }

  async remove(credentialId: string): Promise<void> {
    if (!credentialId.trim()) throw new Error('Passkey credential ID is required')
    await this.run(this.value.status, async () => {
      await this.transport.remove(credentialId)
      this.value.credentials = this.value.credentials.filter(
        (credential) => credential.credentialId !== credentialId,
      )
    })
  }

  private async run(
    status: PasskeyLifecycleSnapshot['status'],
    operation: () => Promise<void>,
  ): Promise<void> {
    this.value.status = status
    this.value.error = null
    try {
      await operation()
    } catch (error) {
      this.value.status = 'error'
      this.value.error = error instanceof Error ? error.message : String(error)
      throw error
    }
  }
}

function deduplicateCredentials(credentials: PasskeyCredential[]): PasskeyCredential[] {
  const byId = new Map<string, PasskeyCredential>()
  for (const credential of credentials) {
    if (!credential.credentialId.trim()) throw new Error('Passkey credential ID is required')
    byId.set(credential.credentialId, structuredClone(credential))
  }
  return [...byId.values()]
}
