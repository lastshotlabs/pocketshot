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
    expect(result.fontSize).toBe('base')
    expect(result.fontWeight).toBe('normal')
    expect(result.textAlign).toBe('left')
  })

  it('accepts shared fontSize values', () => {
    for (const fontSize of ['sm', 'base', 'lg', 'xl'] as const) {
      expect(BodySchema.safeParse({ text: 'X', fontSize }).success).toBe(true)
    }
  })

  it('accepts shared fontWeight values', () => {
    for (const fontWeight of ['normal', 'medium', 'semibold', 'bold', 700] as const) {
      expect(BodySchema.safeParse({ text: 'X', fontWeight }).success).toBe(true)
    }
  })

  it('accepts shared textAlign values', () => {
    for (const textAlign of ['left', 'center', 'right', 'justify'] as const) {
      expect(BodySchema.safeParse({ text: 'X', textAlign }).success).toBe(true)
    }
  })

  it('rejects invalid textAlign', () => {
    expect(BodySchema.safeParse({ text: 'X', textAlign: 'top' }).success).toBe(false)
  })

  it('accepts numberOfLines', () => {
    const result = BodySchema.parse({ text: 'X', numberOfLines: 2 })
    expect(result.numberOfLines).toBe(2)
  })
})
