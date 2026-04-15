import { describe, it, expect } from 'vitest'
import { ScrollContainerSchema } from '../schema'

describe('ScrollContainerSchema', () => {
  it('parses a minimal valid config', () => {
    expect(ScrollContainerSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = ScrollContainerSchema.parse({})
    expect(result.horizontal).toBe(false)
    expect(result.showsScrollIndicator).toBe(false)
    expect(result.refreshable).toBe(false)
  })

  it('parses a full config', () => {
    const result = ScrollContainerSchema.parse({
      id: 'main-scroll',
      horizontal: true,
      showsScrollIndicator: true,
      padding: 16,
      contentPadding: 8,
      refreshable: true,
      testID: 'main-scroll',
    })
    expect(result.horizontal).toBe(true)
    expect(result.refreshable).toBe(true)
  })

  it('accepts onRefresh action', () => {
    const result = ScrollContainerSchema.parse({ onRefresh: { type: 'refresh', target: 'screen' } })
    expect(result.onRefresh).toBeDefined()
  })

  it('rejects non-boolean horizontal', () => {
    expect(ScrollContainerSchema.safeParse({ horizontal: 'yes' }).success).toBe(false)
  })
})
