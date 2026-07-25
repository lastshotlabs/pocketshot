import {
  AccessibilityController,
  MobileShellController,
  conformTouchTarget,
  safeAreaThumbDock,
  type AccessibilityAdapter,
} from '../../src/accessibility'
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

describe('MobileShellController', () => {
  it('shows tabs only outside immersive routes and restores route focus', async () => {
    const focus = vi.fn()
    const shell = new MobileShellController(
      [
        { name: 'play', immersive: false, focusTarget: 'play-heading' },
        {
          name: 'match',
          immersive: true,
          orientation: 'landscape',
          focusTarget: 'match-heading',
        },
      ],
      'play',
      focus,
    )
    await shell.navigate('match')
    expect(shell.snapshot).toMatchObject({
      route: 'match',
      tabsVisible: false,
      orientation: 'landscape',
    })
    expect(focus).toHaveBeenLastCalledWith('match-heading')
    expect(await shell.back()).toBe(true)
    expect(shell.snapshot.tabsVisible).toBe(true)
    expect(focus).toHaveBeenLastCalledWith('play-heading')
  })

  it('enforces platform touch targets and keyboard-safe thumb docks', () => {
    expect(conformTouchTarget('ios', { width: 20, height: 60 })).toEqual({
      width: 44,
      height: 60,
    })
    expect(conformTouchTarget('android', { width: 20, height: 20 })).toEqual({
      width: 48,
      height: 48,
    })
    expect(
      safeAreaThumbDock({
        viewportHeight: 800,
        bottomInset: 34,
        keyboardHeight: 300,
        contentHeight: 80,
      }),
    ).toEqual({ bottom: 300, top: 420 })
  })
})
