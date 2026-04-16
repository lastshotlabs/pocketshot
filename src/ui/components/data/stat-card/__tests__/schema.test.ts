import { describe, it, expect } from 'vitest'
import { StatCardSchema } from '../schema'

describe('StatCardSchema', () => {
  it('parses with string value', () => {
    const result = StatCardSchema.parse({ label: 'Total Users', value: '1,234' })
    expect(result.label).toBe('Total Users')
    expect(result.value).toBe('1,234')
  })

  it('parses with number value', () => {
    const result = StatCardSchema.parse({ label: 'Revenue', value: 5000 })
    expect(result.value).toBe(5000)
  })

  it('parses with from-ref value', () => {
    const result = StatCardSchema.parse({ label: 'Count', value: { from: 'stats' } })
    expect(result.value).toEqual({ from: 'stats' })
  })

  it('requires label', () => {
    expect(StatCardSchema.safeParse({ value: '100' }).success).toBe(false)
  })

  it('requires value', () => {
    expect(StatCardSchema.safeParse({ label: 'Count' }).success).toBe(false)
  })

  it('parses trend object', () => {
    const result = StatCardSchema.parse({
      label: 'Sales',
      value: 100,
      trend: { direction: 'up', value: '+12%' },
    })
    expect(result.trend?.direction).toBe('up')
    expect(result.trend?.value).toBe('+12%')
  })

  it('rejects invalid trend direction', () => {
    expect(
      StatCardSchema.safeParse({
        label: 'Sales',
        value: 100,
        trend: { direction: 'sideways', value: '0%' },
      }).success,
    ).toBe(false)
  })

  it('all optional fields are optional', () => {
    expect(StatCardSchema.safeParse({ label: 'X', value: 0 }).success).toBe(true)
  })

  it('accepts named slot styling surfaces', () => {
    const result = StatCardSchema.parse({
      label: 'Revenue',
      value: 5000,
      slots: {
        value: {
          letterSpacing: 'wide',
        },
        trend: {
          color: 'success',
        },
      },
    })

    expect(result.slots?.value).toMatchObject({ letterSpacing: 'wide' })
    expect(result.slots?.trend).toMatchObject({ color: 'success' })
  })
})
