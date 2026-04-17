import { describe, expect, it } from 'vitest'
import { ImageViewerSchema } from '../schema'

describe('ImageViewerSchema', () => {
  it('parses with string source', () => {
    const result = ImageViewerSchema.parse({
      source: 'https://example.com/photo.jpg',
      alt: 'Photo',
    })

    expect(result.source).toBe('https://example.com/photo.jpg')
    expect(result.alt).toBe('Photo')
  })

  it('parses with from-ref source', () => {
    const result = ImageViewerSchema.parse({
      source: { from: 'gallery.hero' },
    })

    expect(result.source).toEqual({ from: 'gallery.hero' })
  })

  it('applies defaults', () => {
    const result = ImageViewerSchema.parse({
      source: 'https://example.com/photo.jpg',
    })

    expect(result.enableZoom).toBe(true)
    expect(result.maxZoom).toBe(3)
    expect(result.showCloseButton).toBe(true)
  })

  it('accepts shared frame props from the base contract', () => {
    const result = ImageViewerSchema.parse({
      source: 'https://example.com/photo.jpg',
      width: '75%',
      height: 240,
      borderRadius: 'xl',
    })

    expect(result.width).toBe('75%')
    expect(result.height).toBe(240)
    expect(result.borderRadius).toBe('xl')
  })

  it('accepts slot styling surfaces', () => {
    const result = ImageViewerSchema.parse({
      source: 'https://example.com/photo.jpg',
      slots: {
        thumbnailContainer: { borderRadius: 'xl' },
        captionText: { color: 'primary' },
      },
    })

    expect(result.slots?.thumbnailContainer?.borderRadius).toBe('xl')
    expect(result.slots?.captionText?.color).toBe('primary')
  })
})
