import type { BiometricAuthResult, BiometricPromptOptions } from './types'

export class FreshAuthenticationController {
  private authenticatedAt = 0
  private promptRun: Promise<boolean> | null = null

  constructor(
    private readonly prompt: (options?: BiometricPromptOptions) => Promise<BiometricAuthResult>,
    private readonly now: () => number = Date.now,
    private readonly freshnessMs = 5 * 60 * 1_000,
  ) {
    if (!Number.isFinite(freshnessMs) || freshnessMs < 0) {
      throw new Error('Authentication freshness must be non-negative')
    }
  }

  get isFresh(): boolean {
    return this.authenticatedAt > 0 && this.now() - this.authenticatedAt <= this.freshnessMs
  }

  async authenticate(options?: BiometricPromptOptions, force = false): Promise<boolean> {
    if (!force && this.isFresh) return true
    if (this.promptRun) return this.promptRun
    this.promptRun = this.perform(options).finally(() => {
      this.promptRun = null
    })
    return this.promptRun
  }

  async require(
    action: () => void | Promise<void>,
    options?: BiometricPromptOptions,
  ): Promise<void> {
    if (!(await this.authenticate(options))) throw new Error('Fresh authentication required')
    await action()
  }

  invalidate(): void {
    this.authenticatedAt = 0
  }

  private async perform(options?: BiometricPromptOptions): Promise<boolean> {
    const result = await this.prompt(options)
    if (!result.success) {
      this.authenticatedAt = 0
      return false
    }
    this.authenticatedAt = this.now()
    return true
  }
}
