import { describe, it, expect } from 'vitest'
import { DrawerMenuSchema } from '../schema'

describe('DrawerMenuSchema', () => {
  it('parses a minimal valid config', () => {
    const result = DrawerMenuSchema.parse({
      id: 'app-drawer-menu',
      items: [{ id: 'home', label: 'Home' }],
    })
    expect(result.id).toBe('app-drawer-menu')
  })

  it('applies defaults', () => {
    const result = DrawerMenuSchema.parse({
      id: 'app-drawer-menu',
      items: [{ id: 'home', label: 'Home' }],
    })
    expect(result.position).toBe('left')
    expect(result.widthPercent).toBe(80)
  })

  it('accepts slot surfaces', () => {
    const result = DrawerMenuSchema.parse({
      id: 'app-drawer-menu',
      items: [{ id: 'home', label: 'Home' }],
      slots: {
        panel: { bg: 'card' },
        menuItemLabel: { letterSpacing: 'wide' },
        footerLabel: { color: 'muted' },
      },
    })

    expect(result.slots?.panel?.bg).toBe('card')
    expect(result.slots?.menuItemLabel?.letterSpacing).toBe('wide')
    expect(result.slots?.footerLabel?.color).toBe('muted')
  })
})
