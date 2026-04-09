import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Inline mock factories (must not reference variables — vi.mock is hoisted) ──

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  notificationAsync: vi.fn().mockResolvedValue(undefined),
  selectionAsync: vi.fn().mockResolvedValue(undefined),
}))

import * as ExpoHaptics from 'expo-haptics'
import { impact, notification, selection, haptics } from '../../src/haptics/core'

describe('impact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-haptics impactAsync with medium by default', async () => {
    impact()
    await Promise.resolve() // flush microtasks
    expect(vi.mocked(ExpoHaptics.impactAsync)).toHaveBeenCalledWith('medium')
  })

  it('calls impactAsync with the specified style', async () => {
    impact('light')
    await Promise.resolve()
    expect(vi.mocked(ExpoHaptics.impactAsync)).toHaveBeenCalledWith('light')
  })

  it('accepts all valid impact styles', async () => {
    const styles = ['light', 'medium', 'heavy', 'soft', 'rigid'] as const
    for (const style of styles) {
      vi.clearAllMocks()
      impact(style)
      await Promise.resolve()
      expect(vi.mocked(ExpoHaptics.impactAsync)).toHaveBeenCalledWith(style)
    }
  })

  it('is a no-op when disabled option is true', async () => {
    impact('medium', { disabled: true })
    await Promise.resolve()
    expect(vi.mocked(ExpoHaptics.impactAsync)).not.toHaveBeenCalled()
  })

  it('never throws even if expo-haptics errors', () => {
    vi.mocked(ExpoHaptics.impactAsync).mockRejectedValueOnce(new Error('Haptics unavailable'))
    expect(() => impact()).not.toThrow()
  })
})

describe('notification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-haptics notificationAsync with success by default', async () => {
    notification()
    await Promise.resolve()
    expect(vi.mocked(ExpoHaptics.notificationAsync)).toHaveBeenCalledWith('success')
  })

  it('accepts all valid notification types', async () => {
    const types = ['success', 'warning', 'error'] as const
    for (const type of types) {
      vi.clearAllMocks()
      notification(type)
      await Promise.resolve()
      expect(vi.mocked(ExpoHaptics.notificationAsync)).toHaveBeenCalledWith(type)
    }
  })

  it('is a no-op when disabled option is true', async () => {
    notification('success', { disabled: true })
    await Promise.resolve()
    expect(vi.mocked(ExpoHaptics.notificationAsync)).not.toHaveBeenCalled()
  })
})

describe('selection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-haptics selectionAsync', async () => {
    selection()
    await Promise.resolve()
    expect(vi.mocked(ExpoHaptics.selectionAsync)).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when disabled option is true', async () => {
    selection({ disabled: true })
    await Promise.resolve()
    expect(vi.mocked(ExpoHaptics.selectionAsync)).not.toHaveBeenCalled()
  })
})

describe('haptics convenience object', () => {
  it('bundles impact, notification, and selection', () => {
    expect(typeof haptics.impact).toBe('function')
    expect(typeof haptics.notification).toBe('function')
    expect(typeof haptics.selection).toBe('function')
  })

  it('impact delegates to the impact function', async () => {
    vi.clearAllMocks()
    haptics.impact('heavy')
    await Promise.resolve()
    expect(vi.mocked(ExpoHaptics.impactAsync)).toHaveBeenCalledWith('heavy')
  })
})
