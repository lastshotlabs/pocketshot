import { describe, expect, it } from 'vitest'
import { MarkdownSchema } from '../schema'

describe('MarkdownSchema', () => {
  it('parses string content', () => {
    const result = MarkdownSchema.parse({ content: '# Hello' })
    expect(result.content).toBe('# Hello')
  })

  it('parses from-ref content', () => {
    const result = MarkdownSchema.parse({ content: { from: 'article.body' } })
    expect(result.content).toEqual({ from: 'article.body' })
  })

  it('applies shared text defaults', () => {
    const result = MarkdownSchema.parse({ content: 'Hello' })
    expect(result.fontSize).toBe('base')
  })

  it('accepts shared text style props', () => {
    const result = MarkdownSchema.parse({
      content: 'Hello',
      fontSize: 'lg',
      textAlign: 'center',
      color: 'muted',
      lineHeight: 'relaxed',
    })

    expect(result.fontSize).toBe('lg')
    expect(result.textAlign).toBe('center')
    expect(result.color).toBe('muted')
    expect(result.lineHeight).toBe('relaxed')
  })
})
