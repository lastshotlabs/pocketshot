import { describe, expect, it } from 'vitest'
import { ProgressCircleSchema } from '../schema'

describe('ProgressCircleSchema', () => {
  it('parses with numeric value', () => {
    const result = ProgressCircleSchema.parse({ value: 72 })
    expect(result.value).toBe(72)
  })

  it('parses with from-ref value', () => {
    const result = ProgressCircleSchema.parse({ value: { from: 'stats.progress' } })
    expect(result.value).toEqual({ from: 'stats.progress' })
  })

  it('applies defaults', () => {
    const result = ProgressCircleSchema.parse({ value: 20 })
    expect(result.size).toBe('md')
    expect(result.showValue).toBe(true)
    expect(result.animated).toBe(true)
  })

  it('accepts shared color from the base contract', () => {
    const result = ProgressCircleSchema.parse({ value: 48, color: 'success' })
    expect(result.color).toBe('success')
  })
})
