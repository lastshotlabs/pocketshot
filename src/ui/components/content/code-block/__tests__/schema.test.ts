import { describe, expect, it } from 'vitest'
import { CodeBlockSchema } from '../schema'

describe('CodeBlockSchema', () => {
  it('parses string code', () => {
    const result = CodeBlockSchema.parse({ code: 'const x = 1' })
    expect(result.code).toBe('const x = 1')
  })

  it('parses from-ref code', () => {
    const result = CodeBlockSchema.parse({ code: { from: 'snippet.code' } })
    expect(result.code).toEqual({ from: 'snippet.code' })
  })

  it('applies defaults', () => {
    const result = CodeBlockSchema.parse({ code: 'const x = 1' })
    expect(result.showLineNumbers).toBe(true)
    expect(result.showCopyButton).toBe(true)
  })

  it('accepts shared surface and text props', () => {
    const result = CodeBlockSchema.parse({
      code: 'const x = 1',
      bg: 'card',
      borderRadius: 'xl',
      color: 'muted',
      fontSize: 'lg',
    })

    expect(result.bg).toBe('card')
    expect(result.borderRadius).toBe('xl')
    expect(result.color).toBe('muted')
    expect(result.fontSize).toBe('lg')
  })

  it('accepts slot styling surfaces', () => {
    const result = CodeBlockSchema.parse({
      code: 'const x = 1',
      slots: {
        container: { borderRadius: 'xl' },
        header: { paddingY: 'sm' },
        codeLine: { color: 'primary' },
      },
    })

    expect(result.slots?.container?.borderRadius).toBe('xl')
    expect(result.slots?.header?.paddingY).toBe('sm')
    expect(result.slots?.codeLine?.color).toBe('primary')
  })
})
