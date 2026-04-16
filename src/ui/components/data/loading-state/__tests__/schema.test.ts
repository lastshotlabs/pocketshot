import { describe, it, expect } from 'vitest'
import { LoadingStateSchema } from '../schema'

describe('LoadingStateSchema', () => {
  it('parses a minimal valid config', () => {
    expect(LoadingStateSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = LoadingStateSchema.parse({})
    expect(result.variant).toBe('skeleton')
    expect(result.count).toBe(3)
    expect(result.height).toBe(48)
  })

  it('accepts spinner variant', () => {
    const result = LoadingStateSchema.parse({ variant: 'spinner' })
    expect(result.variant).toBe('spinner')
  })

  it('rejects invalid variant', () => {
    expect(LoadingStateSchema.safeParse({ variant: 'pulse' }).success).toBe(false)
  })

  it('rejects non-positive count', () => {
    expect(LoadingStateSchema.safeParse({ count: 0 }).success).toBe(false)
  })

  it('rejects non-integer count', () => {
    expect(LoadingStateSchema.safeParse({ count: 1.5 }).success).toBe(false)
  })

  it('rejects non-positive height', () => {
    expect(LoadingStateSchema.safeParse({ height: -1 }).success).toBe(false)
  })

  it('accepts label and loading slot surfaces', () => {
    const result = LoadingStateSchema.parse({
      label: { from: 'loading.label' },
      slots: {
        spinner: {
          opacity: 0.8,
        },
        label: {
          textAlign: 'center',
        },
        line: {
          opacity: 0.5,
        },
      },
    })

    expect(result.label).toEqual({ from: 'loading.label' })
    expect(result.slots?.spinner).toMatchObject({ opacity: 0.8 })
    expect(result.slots?.line).toMatchObject({ opacity: 0.5 })
  })
})
