import { describe, expect, it } from 'vitest'
import { RatingInputSchema } from '../schema'

describe('RatingInputSchema', () => {
  it('parses a minimal valid config', () => {
    const result = RatingInputSchema.parse({ id: 'rating' })
    expect(result.id).toBe('rating')
  })

  it('applies defaults', () => {
    const result = RatingInputSchema.parse({ id: 'rating' })
    expect(result.maxStars).toBe(5)
    expect(result.size).toBe('md')
    expect(result.allowHalf).toBe(false)
    expect(result.readOnly).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = RatingInputSchema.parse({
      id: 'rating',
      slots: {
        starsRow: { gap: 'lg' },
        star: { color: 'warning' },
      },
    })

    expect(result.slots?.starsRow?.gap).toBe('lg')
    expect(result.slots?.star?.color).toBe('warning')
  })
})
