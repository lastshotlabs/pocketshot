import { describe, it, expect } from 'vitest'
import { DataListSchema } from '../schema'

describe('DataListSchema', () => {
  it('parses a minimal valid config', () => {
    expect(DataListSchema.safeParse({ itemType: 'ProductCard' }).success).toBe(true)
  })

  it('requires itemType', () => {
    expect(DataListSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = DataListSchema.parse({ itemType: 'ProductCard' })
    expect(result.keyExtractor).toBe('id')
    expect(result.emptyMessage).toBe('Nothing here yet')
    expect(result.loadingCount).toBe(3)
    expect(result.refreshable).toBe(false)
    expect(result.numColumns).toBe(1)
    expect(result.estimatedItemSize).toBe(80)
  })

  it('accepts string data spec', () => {
    const result = DataListSchema.parse({ itemType: 'Card', data: 'GET /api/items' })
    expect(result.data).toBe('GET /api/items')
  })

  it('accepts from-ref data spec', () => {
    const result = DataListSchema.parse({ itemType: 'Card', data: { from: 'filters' } })
    expect(result.data).toEqual({ from: 'filters' })
  })

  it('rejects non-positive loadingCount', () => {
    expect(DataListSchema.safeParse({ itemType: 'Card', loadingCount: 0 }).success).toBe(false)
  })

  it('rejects non-positive numColumns', () => {
    expect(DataListSchema.safeParse({ itemType: 'Card', numColumns: -1 }).success).toBe(false)
  })

  it('rejects non-integer numColumns', () => {
    expect(DataListSchema.safeParse({ itemType: 'Card', numColumns: 1.5 }).success).toBe(false)
  })

  it('accepts onItemPress action', () => {
    const result = DataListSchema.parse({
      itemType: 'Card',
      onItemPress: { type: 'navigate', to: '/detail' },
    })
    expect(result.onItemPress).toBeDefined()
  })

  it('accepts list slot styling surfaces', () => {
    const result = DataListSchema.parse({
      itemType: 'Card',
      slots: {
        list: {
          bg: 'card',
        },
        item: {
          paddingY: 'sm',
        },
        itemTitle: {
          letterSpacing: 'wide',
        },
        emptyState: {
          paddingY: 'lg',
        },
        loadingTitle: {
          opacity: 0.7,
        },
      },
    })

    expect(result.slots?.list).toMatchObject({ bg: 'card' })
    expect(result.slots?.loadingTitle).toMatchObject({ opacity: 0.7 })
  })
})
