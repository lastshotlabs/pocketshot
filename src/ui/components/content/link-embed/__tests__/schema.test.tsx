import { describe, expect, it } from 'vitest'
import { LinkEmbedSchema } from '../schema'

describe('LinkEmbedSchema', () => {
  it('parses the required url field', () => {
    const result = LinkEmbedSchema.parse({ url: 'https://example.com/article' })

    expect(result.url).toBe('https://example.com/article')
  })

  it('accepts a provider override', () => {
    const result = LinkEmbedSchema.parse({
      url: 'https://example.com/article',
      provider: 'github',
    })

    expect(result.provider).toBe('github')
  })

  it('accepts slot styling surfaces', () => {
    const result = LinkEmbedSchema.parse({
      url: 'https://example.com/article',
      slots: {
        card: { borderRadius: 'xl' },
        title: { letterSpacing: 'wide' },
        playButton: { bg: 'primary' },
      },
    })

    expect(result.slots?.card?.borderRadius).toBe('xl')
    expect(result.slots?.title?.letterSpacing).toBe('wide')
    expect(result.slots?.playButton?.bg).toBe('primary')
  })
})
