import { describe, expect, it } from 'vitest'
import { RichTextEditorSchema } from '../schema'

describe('RichTextEditorSchema', () => {
  it('requires an id', () => {
    expect(RichTextEditorSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = RichTextEditorSchema.parse({ id: 'notes' })

    expect(result.toolbar).toEqual([
      'heading',
      'bold',
      'italic',
      'list-bullet',
      'blockquote',
      'code',
    ])
    expect(result.minHeight).toBe(120)
    expect(result.maxHeight).toBe(400)
  })

  it('accepts shared dimension inputs', () => {
    const result = RichTextEditorSchema.parse({
      id: 'notes',
      minHeight: '50%',
      maxHeight: 480,
      borderRadius: 'xl',
    })

    expect(result.minHeight).toBe('50%')
    expect(result.maxHeight).toBe(480)
    expect(result.borderRadius).toBe('xl')
  })
})
