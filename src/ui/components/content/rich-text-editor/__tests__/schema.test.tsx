import { describe, expect, it } from 'vitest'
import { RichTextEditorSchema } from '../schema'

describe('RichTextEditorSchema', () => {
  it('parses the required id field', () => {
    const result = RichTextEditorSchema.parse({ id: 'editor' })

    expect(result.id).toBe('editor')
  })

  it('applies defaults', () => {
    const result = RichTextEditorSchema.parse({ id: 'editor' })

    expect(result.toolbar).toEqual(['heading', 'bold', 'italic', 'list-bullet', 'blockquote', 'code'])
    expect(result.minHeight).toBe(120)
    expect(result.maxHeight).toBe(400)
  })

  it('accepts slot styling surfaces', () => {
    const result = RichTextEditorSchema.parse({
      id: 'editor',
      slots: {
        toolbar: { borderRadius: 'xl' },
        input: { borderRadius: 'lg' },
        footerText: { color: 'primary' },
      },
    })

    expect(result.slots?.toolbar?.borderRadius).toBe('xl')
    expect(result.slots?.input?.borderRadius).toBe('lg')
    expect(result.slots?.footerText?.color).toBe('primary')
  })
})
