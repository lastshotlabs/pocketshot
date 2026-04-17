import { describe, it, expect } from 'vitest'
import { DrawerSchema } from '../schema'

describe('DrawerSchema', () => {
  it('parses a minimal valid config', () => {
    const result = DrawerSchema.parse({ id: 'app-drawer' })
    expect(result.id).toBe('app-drawer')
  })

  it('requires id', () => {
    expect(DrawerSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = DrawerSchema.parse({ id: 'drawer-defaults' })
    expect(result.position).toBe('left')
    expect(result.widthPercent).toBe(80)
    expect(result.showHandle).toBe(true)
    expect(result.closeOnBackdrop).toBe(true)
  })

  it('accepts slot surfaces', () => {
    const result = DrawerSchema.parse({
      id: 'styled-drawer',
      slots: {
        panel: { bg: 'card' },
        title: { letterSpacing: 'wide' },
        body: { paddingY: 'lg' },
      },
    })

    expect(result.slots?.panel?.bg).toBe('card')
    expect(result.slots?.title?.letterSpacing).toBe('wide')
    expect(result.slots?.body?.paddingY).toBe('lg')
  })
})
