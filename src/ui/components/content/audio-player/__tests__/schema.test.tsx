import { describe, expect, it } from 'vitest'
import { AudioPlayerSchema } from '../schema'

describe('AudioPlayerSchema', () => {
  it('parses the required source field', () => {
    const result = AudioPlayerSchema.parse({ source: 'https://example.com/audio.mp3' })

    expect(result.source).toBe('https://example.com/audio.mp3')
  })

  it('accepts a from-ref source', () => {
    const result = AudioPlayerSchema.parse({ source: { from: 'media.audio' } })

    expect(result.source).toEqual({ from: 'media.audio' })
  })

  it('accepts ref-backed metadata', () => {
    const result = AudioPlayerSchema.parse({
      source: 'https://example.com/audio.mp3',
      title: { from: 'media.title' },
      artist: { from: 'media.artist' },
    })

    expect(result.title).toEqual({ from: 'media.title' })
    expect(result.artist).toEqual({ from: 'media.artist' })
  })

  it('applies defaults', () => {
    const result = AudioPlayerSchema.parse({ source: 'https://example.com/audio.mp3' })

    expect(result.showWaveform).toBe(true)
    expect(result.autoPlay).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = AudioPlayerSchema.parse({
      source: 'https://example.com/audio.mp3',
      slots: {
        container: { borderRadius: 'xl' },
        playButton: { states: { disabled: { opacity: 0.4 } } },
        timeText: { color: 'primary' },
      },
    })

    expect(result.slots?.container?.borderRadius).toBe('xl')
    expect(result.slots?.playButton?.states?.disabled?.opacity).toBe(0.4)
    expect(result.slots?.timeText?.color).toBe('primary')
  })
})
