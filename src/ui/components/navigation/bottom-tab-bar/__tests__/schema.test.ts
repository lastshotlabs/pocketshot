import { describe, it, expect } from 'vitest'
import { BottomTabBarSchema } from '../schema'

describe('BottomTabBarSchema', () => {
  it('parses a minimal valid config', () => {
    const result = BottomTabBarSchema.parse({
      id: 'main-tabs',
      tabs: [
        { id: 'home', label: 'Home', icon: 'Home' },
        { id: 'profile', label: 'Profile', icon: 'Profile' },
      ],
    })
    expect(result.id).toBe('main-tabs')
  })

  it('applies defaults', () => {
    const result = BottomTabBarSchema.parse({
      id: 'main-tabs',
      tabs: [
        { id: 'home', label: 'Home', icon: 'Home' },
        { id: 'profile', label: 'Profile', icon: 'Profile' },
      ],
    })
    expect(result.position).toBe('bottom')
    expect(result.elevated).toBe(true)
    expect(result.showLabels).toBe(true)
  })

  it('accepts slot surfaces', () => {
    const result = BottomTabBarSchema.parse({
      id: 'main-tabs',
      tabs: [
        { id: 'home', label: 'Home', icon: 'Home' },
        { id: 'profile', label: 'Profile', icon: 'Profile' },
      ],
      slots: {
        tab: { paddingY: 'sm' },
        label: { letterSpacing: 'wide' },
        indicator: { borderRadius: 'full' },
      },
    })

    expect(result.slots?.tab?.paddingY).toBe('sm')
    expect(result.slots?.label?.letterSpacing).toBe('wide')
    expect(result.slots?.indicator?.borderRadius).toBe('full')
  })
})
