import { describe, it, expect } from 'vitest'
import { HeadingSchema } from '../schema'

describe('HeadingSchema', () => {
  it('parses with string text', () => {
    const result = HeadingSchema.parse({ text: 'Welcome' })
    expect(result.text).toBe('Welcome')
  })

  it('parses with from-ref text', () => {
    const result = HeadingSchema.parse({ text: { from: 'pageTitle' } })
    expect(result.text).toEqual({ from: 'pageTitle' })
  })

  it('requires text', () => {
    expect(HeadingSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = HeadingSchema.parse({ text: 'Hello' })
    expect(result.level).toBe(2)
    expect(result.textAlign).toBe('left')
  })

  it('accepts all valid levels', () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      expect(HeadingSchema.safeParse({ text: 'X', level }).success).toBe(true)
    }
  })

  it('rejects invalid level', () => {
    expect(HeadingSchema.safeParse({ text: 'X', level: 7 }).success).toBe(false)
    expect(HeadingSchema.safeParse({ text: 'X', level: 0 }).success).toBe(false)
  })

  it('accepts all valid textAlign values', () => {
    for (const textAlign of ['left', 'center', 'right', 'justify'] as const) {
      expect(HeadingSchema.safeParse({ text: 'X', textAlign }).success).toBe(true)
    }
  })

  it('rejects invalid textAlign', () => {
    expect(HeadingSchema.safeParse({ text: 'X', textAlign: 'sideways' }).success).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = HeadingSchema.parse({
      text: 'Heading',
      slots: {
        text: {
          letterSpacing: 'wide',
          color: 'primary',
        },
      },
    })

    expect(result.slots?.text?.letterSpacing).toBe('wide')
    expect(result.slots?.text?.color).toBe('primary')
  })
})
