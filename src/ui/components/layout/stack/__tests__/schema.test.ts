import { describe, it, expect } from 'vitest'
import { StackSchema } from '../schema'

describe('StackSchema', () => {
  it('parses a minimal valid config', () => {
    const result = StackSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('applies defaults', () => {
    const result = StackSchema.parse({})
    expect(result.gap).toBe(0)
    expect(result.align).toBe('stretch')
    expect(result.justify).toBe('flex-start')
  })

  it('parses a full config', () => {
    const result = StackSchema.parse({
      id: 'main-stack',
      gap: 8,
      padding: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      align: 'center',
      justify: 'space-between',
      backgroundColor: '#ffffff',
      testID: 'main-stack',
    })
    expect(result.id).toBe('main-stack')
    expect(result.gap).toBe(8)
    expect(result.align).toBe('center')
    expect(result.justify).toBe('space-between')
  })

  it('rejects invalid align value', () => {
    const result = StackSchema.safeParse({ align: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid justify value', () => {
    const result = StackSchema.safeParse({ justify: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects non-number gap', () => {
    const result = StackSchema.safeParse({ gap: 'big' })
    expect(result.success).toBe(false)
  })

  it('accepts children array', () => {
    const result = StackSchema.parse({ children: [{ type: 'Heading' }] })
    expect(result.children).toHaveLength(1)
  })

  it('all fields are optional', () => {
    expect(StackSchema.safeParse({}).success).toBe(true)
  })
})
