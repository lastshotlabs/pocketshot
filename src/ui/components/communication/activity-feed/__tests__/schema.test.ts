import { describe, it, expect } from 'vitest'
import { ActivityFeedSchema } from '../schema'

describe('ActivityFeedSchema', () => {
  it('parses a minimal valid config', () => {
    expect(ActivityFeedSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = ActivityFeedSchema.parse({})
    expect(result.emptyMessage).toBe('No activity yet')
    expect(result.itemHeight).toBe(72)
  })

  it('accepts string data spec', () => {
    const result = ActivityFeedSchema.parse({ data: 'GET /api/activity' })
    expect(result.data).toBe('GET /api/activity')
  })

  it('accepts from-ref data spec', () => {
    const result = ActivityFeedSchema.parse({ data: { from: 'feed' } })
    expect(result.data).toEqual({ from: 'feed' })
  })

  it('accepts custom emptyMessage', () => {
    const result = ActivityFeedSchema.parse({ emptyMessage: 'Nothing to show' })
    expect(result.emptyMessage).toBe('Nothing to show')
  })

  it('accepts custom itemHeight', () => {
    const result = ActivityFeedSchema.parse({ itemHeight: 88 })
    expect(result.itemHeight).toBe(88)
  })

  it('rejects non-number itemHeight', () => {
    expect(ActivityFeedSchema.safeParse({ itemHeight: 'tall' }).success).toBe(false)
  })
})
