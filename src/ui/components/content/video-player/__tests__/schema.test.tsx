import { describe, expect, it } from 'vitest'
import { VideoPlayerSchema } from '../schema'

describe('VideoPlayerSchema', () => {
  it('parses the required source field', () => {
    const result = VideoPlayerSchema.parse({ source: 'https://example.com/video.mp4' })

    expect(result.source).toBe('https://example.com/video.mp4')
  })

  it('accepts a ref-backed poster', () => {
    const result = VideoPlayerSchema.parse({
      source: 'https://example.com/video.mp4',
      poster: { from: 'media.poster' },
    })

    expect(result.poster).toEqual({ from: 'media.poster' })
  })

  it('applies defaults', () => {
    const result = VideoPlayerSchema.parse({ source: 'https://example.com/video.mp4' })

    expect(result.autoPlay).toBe(false)
    expect(result.loop).toBe(false)
    expect(result.muted).toBe(false)
    expect(result.controls).toBe(true)
    expect(result.aspectRatio).toBe(16 / 9)
  })

  it('accepts slot styling surfaces', () => {
    const result = VideoPlayerSchema.parse({
      source: 'https://example.com/video.mp4',
      slots: {
        container: { borderRadius: 'xl' },
        centerPlayButton: { borderRadius: 'full' },
        fallbackCommand: { color: 'primary' },
      },
    })

    expect(result.slots?.container?.borderRadius).toBe('xl')
    expect(result.slots?.centerPlayButton?.borderRadius).toBe('full')
    expect(result.slots?.fallbackCommand?.color).toBe('primary')
  })
})
