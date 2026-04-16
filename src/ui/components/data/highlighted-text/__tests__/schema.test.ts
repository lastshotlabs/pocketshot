import { describe, expect, it } from 'vitest'
import { HighlightedTextSchema } from '../schema'

describe('HighlightedTextSchema', () => {
  it('parses with array highlights', () => {
    const result = HighlightedTextSchema.parse({
      text: 'The quick brown fox',
      highlights: ['quick', 'fox'],
    })

    expect(result.highlights).toEqual(['quick', 'fox'])
  })

  it('parses with singular highlight from ref', () => {
    const result = HighlightedTextSchema.parse({
      text: 'The quick brown fox',
      highlight: { from: 'search.query' },
    })

    expect(result.highlight).toEqual({ from: 'search.query' })
  })

  it('accepts mark slot styling', () => {
    const result = HighlightedTextSchema.parse({
      text: 'The quick brown fox',
      highlight: 'fox',
      slots: {
        mark: {
          letterSpacing: 'wide',
          color: 'warning',
        },
      },
    })

    expect(result.slots?.mark).toMatchObject({ letterSpacing: 'wide', color: 'warning' })
  })
})
