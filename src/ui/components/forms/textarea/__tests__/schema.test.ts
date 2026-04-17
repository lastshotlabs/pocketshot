import { describe, it, expect } from 'vitest'
import { TextareaSchema } from '../schema'

describe('TextareaSchema', () => {
  it('parses a minimal valid config', () => {
    expect(TextareaSchema.safeParse({ id: 'bio' }).success).toBe(true)
  })

  it('requires id', () => {
    expect(TextareaSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = TextareaSchema.parse({ id: 'bio' })
    expect(result.minRows).toBe(3)
    expect(result.maxRows).toBe(8)
    expect(result.showCharCount).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = TextareaSchema.parse({
      id: 'bio',
      slots: {
        inputWrapper: { borderRadius: 'lg' },
        label: { letterSpacing: 'wide' },
        charCount: { color: 'muted' },
      },
    })

    expect(result.slots?.inputWrapper?.borderRadius).toBe('lg')
    expect(result.slots?.label?.letterSpacing).toBe('wide')
    expect(result.slots?.charCount?.color).toBe('muted')
  })
})
