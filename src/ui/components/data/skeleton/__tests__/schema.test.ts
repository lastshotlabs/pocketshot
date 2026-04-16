import { describe, expect, it } from 'vitest'
import { SkeletonSchema } from '../schema'

describe('SkeletonSchema', () => {
  it('parses a minimal valid config', () => {
    expect(SkeletonSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = SkeletonSchema.parse({})
    expect(result.variant).toBe('text')
    expect(result.lines).toBe(3)
    expect(result.count).toBe(1)
    expect(result.animated).toBe(true)
  })

  it('accepts custom shape variants and sizing', () => {
    const result = SkeletonSchema.parse({
      variant: 'rectangular',
      width: '60%',
      height: 32,
      borderRadius: 'full',
    })

    expect(result.variant).toBe('rectangular')
    expect(result.width).toBe('60%')
    expect(result.height).toBe(32)
  })

  it('accepts loading slot surfaces', () => {
    const result = SkeletonSchema.parse({
      variant: 'card',
      slots: {
        shape: {
          opacity: 0.6,
        },
        title: {
          width: '70%',
        },
        body: {
          opacity: 0.4,
        },
      },
    })

    expect(result.slots?.shape).toMatchObject({ opacity: 0.6 })
    expect(result.slots?.title).toMatchObject({ width: '70%' })
    expect(result.slots?.body).toMatchObject({ opacity: 0.4 })
  })
})
