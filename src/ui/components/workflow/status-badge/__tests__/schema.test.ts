import { describe, it, expect } from 'vitest'
import { StatusBadgeSchema } from '../schema'

describe('StatusBadgeSchema', () => {
  it('parses with string status', () => {
    const result = StatusBadgeSchema.parse({ status: 'active' })
    expect(result.status).toBe('active')
  })

  it('parses with from-ref status', () => {
    const result = StatusBadgeSchema.parse({ status: { from: 'item' } })
    expect(result.status).toEqual({ from: 'item' })
  })

  it('requires status', () => {
    expect(StatusBadgeSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = StatusBadgeSchema.parse({ status: 'active' })
    expect(result.size).toBe('md')
    expect(result.showDot).toBe(true)
  })

  it('accepts statusMap', () => {
    const result = StatusBadgeSchema.parse({
      status: 'active',
      statusMap: {
        active: { label: 'Active', color: 'success' },
        inactive: { label: 'Inactive', color: 'default' },
      },
    })
    expect(result.statusMap?.active?.label).toBe('Active')
  })

  it('rejects invalid color in statusMap', () => {
    expect(StatusBadgeSchema.safeParse({
      status: 'active',
      statusMap: { active: { label: 'Active', color: 'red' } },
    }).success).toBe(false)
  })

  it('accepts all valid colors', () => {
    for (const color of ['primary', 'success', 'warning', 'error', 'info', 'default'] as const) {
      expect(StatusBadgeSchema.safeParse({
        status: 'x',
        statusMap: { x: { label: 'X', color } },
      }).success).toBe(true)
    }
  })

  it('accepts both valid sizes', () => {
    for (const size of ['sm', 'md'] as const) {
      expect(StatusBadgeSchema.safeParse({ status: 'x', size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(StatusBadgeSchema.safeParse({ status: 'x', size: 'lg' }).success).toBe(false)
  })
})
