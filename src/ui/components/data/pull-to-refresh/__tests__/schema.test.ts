import { describe, expect, it } from 'vitest'
import { PullToRefreshSchema } from '../schema'

describe('PullToRefreshSchema', () => {
  it('requires onRefresh', () => {
    expect(PullToRefreshSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = PullToRefreshSchema.parse({ onRefresh: { type: 'custom' } })
    expect(result.refreshing).toBe(false)
  })

  it('accepts from-ref refreshing', () => {
    const result = PullToRefreshSchema.parse({
      onRefresh: { type: 'custom' },
      refreshing: { from: 'loading.refreshing' },
    })

    expect(result.refreshing).toEqual({ from: 'loading.refreshing' })
  })

  it('accepts shared color from the base contract', () => {
    const result = PullToRefreshSchema.parse({
      onRefresh: { type: 'custom' },
      color: 'primary',
    })

    expect(result.color).toBe('primary')
  })
})
