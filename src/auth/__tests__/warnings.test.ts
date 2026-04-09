import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { _resetWarnings } from '../../lib/warnings'

// ── Globals ───────────────────────────────────────────────────────────────────

// React Native defines __DEV__ as a global. Set it before importing validateConfig.
;(globalThis as any).__DEV__ = true

// ── Module import (after __DEV__ is set) ─────────────────────────────────────

import { validateConfig } from '../warnings'
import type { PocketshotConfig } from '../../create-pocketshot'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<PocketshotConfig> = {}): PocketshotConfig {
  return {
    apiUrl: 'https://api.example.com',
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('validateConfig', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    _resetWarnings()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('emits no warnings for a valid config', () => {
    validateConfig(makeConfig())
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns when apiUrl uses http://', () => {
    validateConfig(makeConfig({ apiUrl: 'http://api.example.com' }))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('apiUrl uses http://'),
    )
  })

  it('warns when loginPath is missing leading slash', () => {
    validateConfig(makeConfig({ loginPath: 'auth/login' }))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('loginPath'),
    )
  })

  it('does NOT warn when loginPath has leading slash', () => {
    validateConfig(makeConfig({ loginPath: '/(auth)/login' }))
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns when homePath is missing leading slash', () => {
    validateConfig(makeConfig({ homePath: 'app/home' }))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('homePath'),
    )
  })

  it('warns when mfaPath is missing leading slash', () => {
    validateConfig(makeConfig({ mfaPath: 'auth/mfa' }))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('mfaPath'),
    )
  })

  it('warns when wsEndpoint does not start with ws:// or wss://', () => {
    validateConfig(makeConfig({ wsEndpoint: 'https://ws.example.com' }))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('wsEndpoint must start with ws://'),
    )
  })

  it('warns when wsEndpoint uses insecure ws://', () => {
    validateConfig(makeConfig({ wsEndpoint: 'ws://ws.example.com' }))
    const messages = warnSpy.mock.calls.flat()
    expect(messages.some((m) => String(m).includes('ws://'))).toBe(true)
  })

  it('does NOT warn when wsEndpoint uses wss://', () => {
    validateConfig(makeConfig({ wsEndpoint: 'wss://ws.example.com' }))
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns when authErrors.verbose is true', () => {
    validateConfig(makeConfig({ authErrors: { verbose: true } }))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('authErrors.verbose'),
    )
  })

  it('does not repeat a warning on second call', () => {
    validateConfig(makeConfig({ apiUrl: 'http://api.example.com' }))
    validateConfig(makeConfig({ apiUrl: 'http://api.example.com' }))
    const insecureCalls = warnSpy.mock.calls.filter((args) =>
      String(args[0]).includes('apiUrl uses http://'),
    )
    expect(insecureCalls).toHaveLength(1)
  })

  it('is a no-op when __DEV__ is false', () => {
    ;(globalThis as any).__DEV__ = false
    _resetWarnings()
    validateConfig(makeConfig({ apiUrl: 'http://api.example.com' }))
    expect(warnSpy).not.toHaveBeenCalled()
    ;(globalThis as any).__DEV__ = true
  })
})
