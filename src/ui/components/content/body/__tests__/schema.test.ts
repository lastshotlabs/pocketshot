import { describe, it, expect } from 'vitest'
import { BodySchema } from '../schema'

describe('BodySchema', () => {
  it('parses with string text', () => {
    const result = BodySchema.parse({ text: 'Hello world' })
    expect(result.text).toBe('Hello world')
  })

  it('parses with from-ref text', () => {
    const result = BodySchema.parse({ text: { from: 'content' } })
    expect(result.text).toEqual({ from: 'content' })
  })

  it('requires text', () => {
    expect(BodySchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = BodySchema.parse({ text: 'X' })
    expect(result.size).toBe('md')
    expect(result.weight).toBe('regular')
    expect(result.align).toBe('left')
  })

  it('accepts all valid sizes', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      expect(BodySchema.safeParse({ text: 'X', size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(BodySchema.safeParse({ text: 'X', size: 'xl' }).success).toBe(false)
  })

  it('accepts all valid weights', () => {
    for (const weight of ['regular', 'medium', 'semibold', 'bold'] as const) {
      expect(BodySchema.safeParse({ text: 'X', weight }).success).toBe(true)
    }
  })

  it('rejects invalid weight', () => {
    expect(BodySchema.safeParse({ text: 'X', weight: 'thin' }).success).toBe(false)
  })

  it('accepts numberOfLines', () => {
    const result = BodySchema.parse({ text: 'X', numberOfLines: 2 })
    expect(result.numberOfLines).toBe(2)
  })
})
