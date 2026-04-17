import { describe, it, expect } from 'vitest'
import { SearchBarSchema } from '../schema'

describe('SearchBarSchema', () => {
  it('parses a minimal valid config', () => {
    const result = SearchBarSchema.parse({ id: 'search' })
    expect(result.id).toBe('search')
  })

  it('applies defaults', () => {
    const result = SearchBarSchema.parse({ id: 'search' })
    expect(result.placeholder).toBe('Search...')
    expect(result.debounceMs).toBe(300)
    expect(result.showCancelButton).toBe(false)
    expect(result.autoFocus).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = SearchBarSchema.parse({
      id: 'search',
      slots: {
        inputContainer: { borderRadius: 'lg' },
        input: { letterSpacing: 'wide' },
        cancelText: { color: 'primary' },
      },
    })

    expect(result.slots?.inputContainer?.borderRadius).toBe('lg')
    expect(result.slots?.input?.letterSpacing).toBe('wide')
    expect(result.slots?.cancelText?.color).toBe('primary')
  })
})
