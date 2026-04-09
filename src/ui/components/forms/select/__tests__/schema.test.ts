import { describe, it, expect } from 'vitest'
import { SelectSchema } from '../schema'

describe('SelectSchema', () => {
  it('parses with array options', () => {
    const result = SelectSchema.parse({
      id: 'country',
      options: [
        { label: 'USA', value: 'us' },
        { label: 'UK', value: 'uk' },
      ],
    })
    expect(result.options).toHaveLength(2)
  })

  it('parses with from-ref options', () => {
    const result = SelectSchema.parse({ id: 'status', options: { from: 'statusOptions' } })
    expect(result.options).toEqual({ from: 'statusOptions' })
  })

  it('requires id', () => {
    expect(SelectSchema.safeParse({ options: [] }).success).toBe(false)
  })

  it('requires options', () => {
    expect(SelectSchema.safeParse({ id: 'country' }).success).toBe(false)
  })

  it('applies placeholder default', () => {
    const result = SelectSchema.parse({ id: 'x', options: [] })
    expect(result.placeholder).toBe('Select an option')
  })

  it('accepts from-ref value', () => {
    const result = SelectSchema.parse({ id: 'x', options: [], value: { from: 'form' } })
    expect(result.value).toEqual({ from: 'form' })
  })

  it('accepts string value', () => {
    const result = SelectSchema.parse({ id: 'x', options: [], value: 'us' })
    expect(result.value).toBe('us')
  })

  it('option requires label and value', () => {
    expect(SelectSchema.safeParse({ id: 'x', options: [{ label: 'USA' }] }).success).toBe(false)
    expect(SelectSchema.safeParse({ id: 'x', options: [{ value: 'us' }] }).success).toBe(false)
  })
})
