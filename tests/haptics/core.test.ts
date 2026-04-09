import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before vi.mock factories, so these refs are valid when the factory runs
const hapticsMocks = vi.hoisted(() => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  notificationAsync: vi.fn().mockResolvedValue(undefined),
  selectionAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('expo-haptics', () => hapticsMocks)

import { impact, notification, selection, haptics } from '../../src/haptics/core'

describe('impact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-haptics impactAsync with medium by default', async () => {
    impact()
    await Promise.resolve() // flush microtasks
    expect(hapticsMocks.impactAsync).toHaveBeenCalledWith('medium')
  })

  it('calls impactAsync with the specified style', async () => {
    impact('light')
    await Promise.resolve()
    expect(hapticsMocks.impactAsync).toHaveBeenCalledWith('light')
  })

  it('accepts all valid impact styles', async () => {
    const styles = ['light', 'medium', 'heavy', 'soft', 'rigid'] as const
    for (const style of styles) {
      vi.clearAllMocks()
      impact(style)
      await Promise.resolve()
      expect(hapticsMocks.impactAsync).toHaveBeenCalledWith(style)
    }
  })

  it('is a no-op when disabled option is true', async () => {
    impact('medium', { disabled: true })
    await Promise.resolve()
    expect(hapticsMocks.impactAsync).not.toHaveBeenCalled()
  })

  it('never throws even if expo-haptics errors', () => {
    hapticsMocks.impactAsync.mockRejectedValueOnce(new Error('Haptics unavailable'))
    expect(() => impact()).not.toThrow()
  })
})

describe('notification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-haptics notificationAsync with success by default', async () => {
    notification()
    await Promise.resolve()
    expect(hapticsMocks.notificationAsync).toHaveBeenCalledWith('success')
  })

  it('accepts all valid notification types', async () => {
    const types = ['success', 'warning', 'error'] as const
    for (const type of types) {
      vi.clearAllMocks()
      notification(type)
      await Promise.resolve()
      expect(hapticsMocks.notificationAsync).toHaveBeenCalledWith(type)
    }
  })

  it('is a no-op when disabled option is true', async () => {
    notification('success', { disabled: true })
    await Promise.resolve()
    expect(hapticsMocks.notificationAsync).not.toHaveBeenCalled()
  })
})

describe('selection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-haptics selectionAsync', async () => {
    selection()
    await Promise.resolve()
    expect(hapticsMocks.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when disabled option is true', async () => {
    selection({ disabled: true })
    await Promise.resolve()
    expect(hapticsMocks.selectionAsync).not.toHaveBeenCalled()
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
    expect(hapticsMocks.impactAsync).toHaveBeenCalledWith('heavy')
  })
})
