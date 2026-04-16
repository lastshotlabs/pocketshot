import { describe, it, expect } from 'vitest'
import { ProgressBarSchema } from '../schema'

describe('ProgressBarSchema', () => {
  it('parses with numeric value', () => {
    const result = ProgressBarSchema.parse({ value: 50 })
    expect(result.value).toBe(50)
  })

  it('parses with from-ref value', () => {
    const result = ProgressBarSchema.parse({ value: { from: 'progress' } })
    expect(result.value).toEqual({ from: 'progress' })
  })

  it('requires value', () => {
    expect(ProgressBarSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = ProgressBarSchema.parse({ value: 0 })
    expect(result.showValue).toBe(false)
    expect(result.variant).toBe('default')
    expect(result.animated).toBe(true)
    expect(result.height).toBe(8)
    expect(result.borderRadius).toBe('full')
  })

  it('rejects value below 0', () => {
    expect(ProgressBarSchema.safeParse({ value: -1 }).success).toBe(false)
  })

  it('rejects value above 100', () => {
    expect(ProgressBarSchema.safeParse({ value: 101 }).success).toBe(false)
  })

  it('accepts boundary values 0 and 100', () => {
    expect(ProgressBarSchema.safeParse({ value: 0 }).success).toBe(true)
    expect(ProgressBarSchema.safeParse({ value: 100 }).success).toBe(true)
  })

  it('accepts all valid variants', () => {
    for (const variant of ['default', 'success', 'warning', 'error'] as const) {
      expect(ProgressBarSchema.safeParse({ value: 50, variant }).success).toBe(true)
    }
  })

  it('rejects invalid variant', () => {
    expect(ProgressBarSchema.safeParse({ value: 50, variant: 'info' }).success).toBe(false)
  })

  it('accepts all valid shared borderRadius values', () => {
    for (const borderRadius of ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const) {
      expect(ProgressBarSchema.safeParse({ value: 50, borderRadius }).success).toBe(true)
    }
  })

  it('rejects non-positive height', () => {
    expect(ProgressBarSchema.safeParse({ value: 50, height: 0 }).success).toBe(false)
  })

  it('accepts bar slot styling surfaces', () => {
    const result = ProgressBarSchema.parse({
      value: 50,
      label: { from: 'upload.label' },
      slots: {
        label: {
          letterSpacing: 'wide',
        },
        value: {
          color: 'muted',
        },
        track: {
          opacity: 0.5,
        },
        fill: {
          opacity: 0.9,
        },
      },
    })

    expect(result.label).toEqual({ from: 'upload.label' })
    expect(result.slots?.label).toMatchObject({ letterSpacing: 'wide' })
    expect(result.slots?.fill).toMatchObject({ opacity: 0.9 })
  })
})
