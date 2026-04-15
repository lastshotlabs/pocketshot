import { describe, expect, it } from 'vitest'
import { RichTextViewerSchema } from '../schema'

describe('RichTextViewerSchema', () => {
  it('parses string content', () => {
    const result = RichTextViewerSchema.parse({ content: '<p>Hello</p>' })
    expect(result.content).toBe('<p>Hello</p>')
  })

  it('parses from-ref content', () => {
    const result = RichTextViewerSchema.parse({ content: { from: 'article.html' } })
    expect(result.content).toEqual({ from: 'article.html' })
  })

  it('applies defaults', () => {
    const result = RichTextViewerSchema.parse({ content: '<p>Hello</p>' })
    expect(result.showExpandButton).toBe(true)
  })

  it('accepts shared text styling props', () => {
    const result = RichTextViewerSchema.parse({
      content: '<p>Hello</p>',
      color: 'muted',
      fontSize: 'lg',
      textAlign: 'center',
      lineHeight: 'relaxed',
    })

    expect(result.color).toBe('muted')
    expect(result.fontSize).toBe('lg')
    expect(result.textAlign).toBe('center')
    expect(result.lineHeight).toBe('relaxed')
  })
})
