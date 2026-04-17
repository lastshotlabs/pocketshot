import { describe, expect, it } from 'vitest'
import { RichTextViewerSchema } from '../schema'

describe('RichTextViewerSchema', () => {
  it('parses the required content field', () => {
    const result = RichTextViewerSchema.parse({ content: '<p>Hello</p>' })

    expect(result.content).toBe('<p>Hello</p>')
  })

  it('accepts ref-backed content', () => {
    const result = RichTextViewerSchema.parse({ content: { from: 'article.body' } })

    expect(result.content).toEqual({ from: 'article.body' })
  })

  it('applies defaults', () => {
    const result = RichTextViewerSchema.parse({ content: '<p>Hello</p>' })

    expect(result.showExpandButton).toBe(true)
  })

  it('accepts slot styling surfaces', () => {
    const result = RichTextViewerSchema.parse({
      content: '<p>Hello</p>',
      slots: {
        heading: { letterSpacing: 'wide' },
        paragraph: { color: 'muted' },
        expandText: { color: 'primary' },
      },
    })

    expect(result.slots?.heading?.letterSpacing).toBe('wide')
    expect(result.slots?.paragraph?.color).toBe('muted')
    expect(result.slots?.expandText?.color).toBe('primary')
  })
})
