import { describe, it, expect } from 'vitest'
import { EmptyStateSchema } from '../schema'

describe('EmptyStateSchema', () => {
  it('parses a minimal valid config', () => {
    expect(EmptyStateSchema.safeParse({}).success).toBe(true)
  })

  it('applies default title', () => {
    const result = EmptyStateSchema.parse({})
    expect(result.title).toBe('Nothing here yet')
  })

  it('overrides default title', () => {
    const result = EmptyStateSchema.parse({ title: 'No results found' })
    expect(result.title).toBe('No results found')
  })

  it('parses a full config', () => {
    const result = EmptyStateSchema.parse({
      id: 'empty',
      title: 'No posts',
      description: 'Create your first post',
      icon: 'document',
      action: { label: 'Create Post', onPress: { type: 'navigate', path: '/new' } },
      testID: 'empty-state',
    })
    expect(result.action?.label).toBe('Create Post')
  })

  it('requires action.label when action provided', () => {
    // action.onPress is z.custom() — runtime-transparent, so only label is enforced
    expect(EmptyStateSchema.safeParse({ action: { onPress: { type: 'navigate', path: '/' } } }).success).toBe(false)
  })
})
