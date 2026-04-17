import { describe, expect, it } from 'vitest'
import { PullToRefreshSchema } from '../schema'

describe('PullToRefreshSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      PullToRefreshSchema.parse({
        onRefresh: { type: 'set-value', target: 'feed.refresh', value: true },
      }),
    ).toBeDefined()
  })

  it('accepts from-ref refreshing state and slots', () => {
    expect(
      PullToRefreshSchema.parse({
        id: 'feed-refresh',
        refreshing: { from: 'feed.refreshing' },
        onRefresh: { type: 'set-value', target: 'feed.refresh', value: true },
        slots: {
          scrollView: {
            paddingY: 'lg',
          },
        },
      }),
    ).toBeDefined()
  })
})
