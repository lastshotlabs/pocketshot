import { warnOnce } from '../lib/warnings'
import type { PocketshotConfig } from '../create-pocketshot'

/**
 * Validates the Pocketshot config object at `createPocketshot()` call time and
 * emits one-time console warnings for common misconfigurations.
 *
 * All checks are guarded by `__DEV__` and are no-ops in production builds.
 *
 * @param config - The config object passed to `createPocketshot`.
 */
export function validateConfig(config: PocketshotConfig): void {
  if (!__DEV__) return

  if (config.apiUrl.startsWith('http://')) {
    warnOnce('insecure-url', '[pocketshot] apiUrl uses http:// — never use http:// in production')
  }

  if (config.loginPath && !config.loginPath.startsWith('/')) {
    warnOnce('login-path', `[pocketshot] loginPath "${config.loginPath}" should start with "/"`)
  }

  if (config.homePath && !config.homePath.startsWith('/')) {
    warnOnce('home-path', `[pocketshot] homePath "${config.homePath}" should start with "/"`)
  }

  if (config.mfaPath && !config.mfaPath.startsWith('/')) {
    warnOnce('mfa-path', `[pocketshot] mfaPath "${config.mfaPath}" should start with "/"`)
  }

  if (
    config.wsEndpoint &&
    !config.wsEndpoint.startsWith('ws://') &&
    !config.wsEndpoint.startsWith('wss://')
  ) {
    warnOnce('ws-endpoint', `[pocketshot] wsEndpoint must start with ws:// or wss://`)
  }

  if (config.wsEndpoint?.startsWith('ws://')) {
    warnOnce('insecure-ws', '[pocketshot] wsEndpoint uses ws:// — never use ws:// in production')
  }

  if (config.authErrors?.verbose) {
    warnOnce('verbose-errors', '[pocketshot] authErrors.verbose is enabled — disable in production')
  }
}
