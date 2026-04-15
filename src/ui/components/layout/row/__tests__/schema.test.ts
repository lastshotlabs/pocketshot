import { describe, it, expect } from 'vitest'
import { RowSchema } from '../schema'

describe('RowSchema', () => {
  it('parses a minimal valid config', () => {
    expect(RowSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = RowSchema.parse({})
    expect(result.gap).toBe(0)
    expect(result.alignItems).toBe('stretch')
    expect(result.justifyContent).toBe('start')
    expect(result.flexWrap).toBe('nowrap')
  })

  it('parses a full config', () => {
    const result = RowSchema.parse({
      id: 'action-row',
      gap: 12,
      padding: 'md',
      paddingX: 'lg',
      paddingY: 'sm',
      alignItems: 'center',
      justifyContent: 'between',
      flexWrap: 'wrap',
      bg: '#f0f0f0',
      testID: 'action-row',
    })
    expect(result.flexWrap).toBe('wrap')
    expect(result.justifyContent).toBe('between')
  })

  it('rejects invalid alignItems value', () => {
    expect(RowSchema.safeParse({ alignItems: 'top' }).success).toBe(false)
  })

  it('rejects invalid justifyContent value', () => {
    expect(RowSchema.safeParse({ justifyContent: 'space-between' }).success).toBe(false)
  })

  it('rejects invalid flexWrap value', () => {
    expect(RowSchema.safeParse({ flexWrap: 'yes' }).success).toBe(false)
  })
})
