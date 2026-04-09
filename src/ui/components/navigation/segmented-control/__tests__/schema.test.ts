import { describe, it, expect } from 'vitest'
import { SegmentedControlSchema } from '../schema'

const baseOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
]

describe('SegmentedControlSchema', () => {
  it('parses a valid config', () => {
    const result = SegmentedControlSchema.parse({ id: 'period', options: baseOptions })
    expect(result.options).toHaveLength(2)
  })

  it('requires id', () => {
    expect(SegmentedControlSchema.safeParse({ options: baseOptions }).success).toBe(false)
  })

  it('requires options', () => {
    expect(SegmentedControlSchema.safeParse({ id: 'x' }).success).toBe(false)
  })

  it('accepts from-ref value', () => {
    const result = SegmentedControlSchema.parse({
      id: 'x',
      options: baseOptions,
      value: { from: 'filter' },
    })
    expect(result.value).toEqual({ from: 'filter' })
  })

  it('accepts string value', () => {
    const result = SegmentedControlSchema.parse({ id: 'x', options: baseOptions, value: 'week' })
    expect(result.value).toBe('week')
  })

  it('option requires label and value', () => {
    expect(SegmentedControlSchema.safeParse({ id: 'x', options: [{ label: 'Day' }] }).success).toBe(
      false,
    )
  })
})
