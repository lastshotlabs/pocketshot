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
    expect(result.radius).toBe('none')
  })

  it('accepts numeric width', () => {
    const result = ImageSchema.parse({ src: 'x', alt: 'X', width: 200 })
    expect(result.width).toBe(200)
  })

  it('accepts "100%" width', () => {
    const result = ImageSchema.parse({ src: 'x', alt: 'X', width: '100%' })
    expect(result.width).toBe('100%')
  })

  it('rejects non-numeric non-100% width', () => {
    expect(ImageSchema.safeParse({ src: 'x', alt: 'X', width: '50%' }).success).toBe(false)
  })

  it('accepts all valid resizeModes', () => {
    for (const resizeMode of ['cover', 'contain', 'stretch', 'center'] as const) {
      expect(ImageSchema.safeParse({ src: 'x', alt: 'X', resizeMode }).success).toBe(true)
    }
  })

  it('accepts all valid radius values', () => {
    for (const radius of ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const) {
      expect(ImageSchema.safeParse({ src: 'x', alt: 'X', radius }).success).toBe(true)
    }
  })

  it('accepts aspectRatio', () => {
    const result = ImageSchema.parse({ src: 'x', alt: 'X', aspectRatio: 1.5 })
    expect(result.aspectRatio).toBe(1.5)
  })
})
