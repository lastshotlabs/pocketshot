import { AccessibilityController, type AccessibilityAdapter } from '../../src/accessibility'
import { describe, expect, it, vi } from 'vitest'

function adapter(): AccessibilityAdapter {
  return { announce: vi.fn(), focus: vi.fn() }
}

describe('AccessibilityController', () => {
  it('supports 200% font scaling, reduced motion, and high contrast', () => {
    const accessibility = new AccessibilityController(adapter())
    accessibility.update({ fontScale: 2, reduceMotion: true, highContrast: true })
    expect(accessibility.preferences.fontScale).toBe(2)
    expect(accessibility.duration(250)).toBe(0)
    expect(accessibility.contrast('#777', '#000')).toBe('#000')
  })

  it('validates font scale and animation duration', () => {
    const accessibility = new AccessibilityController(adapter())
    expect(() => accessibility.update({ fontScale: 2.1 })).toThrow('between')
    expect(() => accessibility.duration(-1)).toThrow('negative')
  })

  it('announces only with a screen reader and restores focus', async () => {
    const native = adapter()
    const accessibility = new AccessibilityController(native)
    await accessibility.announce('hidden')
    accessibility.update({ screenReaderEnabled: true })
    await accessibility.announce('Saved')
    await accessibility.restoreFocus('save-button')
    expect(native.announce).toHaveBeenCalledOnce()
    expect(native.announce).toHaveBeenCalledWith('Saved')
    expect(native.focus).toHaveBeenCalledWith('save-button')
  })
})
