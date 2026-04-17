import { describe, it, expect } from 'vitest'
import { BottomSheetSchema } from '../schema'

describe('BottomSheetSchema', () => {
  it('parses a minimal valid config', () => {
    const result = BottomSheetSchema.parse({ id: 'filters-sheet' })
    expect(result.id).toBe('filters-sheet')
  })

  it('requires id', () => {
    expect(BottomSheetSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = BottomSheetSchema.parse({ id: 'x' })
    expect(result.snapPoints).toEqual(['50%'])
    expect(result.showHandle).toBe(true)
    expect(result.closeOnBackdrop).toBe(true)
  })

  it('accepts custom snapPoints', () => {
    const result = BottomSheetSchema.parse({ id: 'x', snapPoints: ['25%', '50%', '90%'] })
    expect(result.snapPoints).toHaveLength(3)
  })

  it('accepts title', () => {
    const result = BottomSheetSchema.parse({ id: 'x', title: 'Filter Results' })
    expect(result.title).toBe('Filter Results')
  })

  it('accepts showHandle false', () => {
    const result = BottomSheetSchema.parse({ id: 'x', showHandle: false })
    expect(result.showHandle).toBe(false)
  })

  it('rejects non-string-array snapPoints', () => {
    expect(BottomSheetSchema.safeParse({ id: 'x', snapPoints: [50] }).success).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = BottomSheetSchema.parse({
      id: 'x',
      slots: {
        panel: { bg: 'card' },
        title: { letterSpacing: 'wide' },
        content: { paddingY: 'lg' },
      },
    })

    expect(result.slots?.panel?.bg).toBe('card')
    expect(result.slots?.title?.letterSpacing).toBe('wide')
    expect(result.slots?.content?.paddingY).toBe('lg')
  })
})
