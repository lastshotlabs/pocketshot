import { describe, it, expect } from 'vitest'
import { TopBarSchema } from '../schema'

describe('TopBarSchema', () => {
  it('parses a minimal valid config', () => {
    const result = TopBarSchema.parse({ title: 'Home' })
    expect(result.title).toBe('Home')
  })

  it('applies defaults', () => {
    const result = TopBarSchema.parse({ title: 'Home' })
    expect(result.transparent).toBe(false)
    expect(result.elevated).toBe(true)
  })

  it('accepts slot surfaces', () => {
    const result = TopBarSchema.parse({
      title: 'Home',
      slots: {
        row: { paddingY: 'sm' },
        title: { letterSpacing: 'wide' },
        iconText: { color: 'primary' },
      },
    })

    expect(result.slots?.row?.paddingY).toBe('sm')
    expect(result.slots?.title?.letterSpacing).toBe('wide')
    expect(result.slots?.iconText?.color).toBe('primary')
  })
})
