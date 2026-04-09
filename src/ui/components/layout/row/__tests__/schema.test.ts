import { describe, it, expect } from 'vitest'
import { RowSchema } from '../schema'

describe('RowSchema', () => {
  it('parses a minimal valid config', () => {
    expect(RowSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = RowSchema.parse({})
    expect(result.gap).toBe(0)
    expect(result.align).toBe('stretch')
    expect(result.justify).toBe('flex-start')
    expect(result.wrap).toBe(false)
  })

  it('parses a full config', () => {
    const result = RowSchema.parse({
      id: 'action-row',
      gap: 12,
      padding: 8,
      align: 'center',
      justify: 'space-between',
      wrap: true,
      backgroundColor: '#f0f0f0',
      testID: 'action-row',
    })
    expect(result.wrap).toBe(true)
    expect(result.justify).toBe('space-between')
  })

  it('rejects invalid align value', () => {
    expect(RowSchema.safeParse({ align: 'top' }).success).toBe(false)
  })

  it('rejects invalid justify value', () => {
    expect(RowSchema.safeParse({ justify: 'evenly' }).success).toBe(false)
  })

  it('rejects non-boolean wrap', () => {
    expect(RowSchema.safeParse({ wrap: 'yes' }).success).toBe(false)
  })
})
