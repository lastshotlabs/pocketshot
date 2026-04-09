import { describe, it, expect } from 'vitest'
import { ToastSchema } from '../schema'

describe('ToastSchema', () => {
  it('parses a minimal valid config', () => {
    expect(ToastSchema.safeParse({}).success).toBe(true)
  })

  it('applies default position', () => {
    const result = ToastSchema.parse({})
    expect(result.position).toBe('bottom')
  })

  it('accepts top position', () => {
    const result = ToastSchema.parse({ position: 'top' })
    expect(result.position).toBe('top')
  })

  it('rejects invalid position', () => {
    expect(ToastSchema.safeParse({ position: 'middle' }).success).toBe(false)
  })

  it('accepts id', () => {
    const result = ToastSchema.parse({ id: 'app-toast' })
    expect(result.id).toBe('app-toast')
  })
})
