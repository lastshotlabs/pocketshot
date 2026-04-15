import { describe, it, expect } from 'vitest'
import { ImageSchema } from '../schema'

describe('ImageSchema', () => {
  it('parses with string src', () => {
    const result = ImageSchema.parse({ src: 'https://example.com/img.png', alt: 'Photo' })
    expect(result.src).toBe('https://example.com/img.png')
    expect(result.alt).toBe('Photo')
  })

  it('parses with from-ref src', () => {
    const result = ImageSchema.parse({ src: { from: 'product' }, alt: 'Product image' })
    expect(result.src).toEqual({ from: 'product' })
  })

  it('requires src', () => {
    expect(ImageSchema.safeParse({ alt: 'X' }).success).toBe(false)
  })

  it('requires alt', () => {
    expect(ImageSchema.safeParse({ src: 'https://x.com/img.png' }).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = ImageSchema.parse({ src: 'https://x.com/img.png', alt: 'X' })
    expect(result.resizeMode).toBe('cover')
  })

  it('accepts numeric width', () => {
    const result = ImageSchema.parse({ src: 'x', alt: 'X', width: 200 })
    expect(result.width).toBe(200)
  })

  it('accepts percentage widths from the shared dimension contract', () => {
    const result = ImageSchema.parse({ src: 'x', alt: 'X', width: '50%' })
    expect(result.width).toBe('50%')
  })

  it('accepts all valid resizeModes', () => {
    for (const resizeMode of ['cover', 'contain', 'stretch', 'center'] as const) {
      expect(ImageSchema.safeParse({ src: 'x', alt: 'X', resizeMode }).success).toBe(true)
    }
  })

  it('accepts shared borderRadius values', () => {
    for (const borderRadius of ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const) {
      expect(ImageSchema.safeParse({ src: 'x', alt: 'X', borderRadius }).success).toBe(true)
    }
  })

  it('accepts aspectRatio', () => {
    const result = ImageSchema.parse({ src: 'x', alt: 'X', aspectRatio: 1.5 })
    expect(result.aspectRatio).toBe(1.5)
  })
})
