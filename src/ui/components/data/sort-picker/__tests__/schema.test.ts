import { describe, expect, it } from 'vitest'
import { SortPickerSchema } from '../schema'

describe('SortPickerSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      SortPickerSchema.parse({
        id: 'sorter',
        options: [
          { value: 'recent', label: 'Most Recent' },
          { value: 'oldest', label: 'Oldest' },
        ],
        onSelect: { type: 'custom' },
      }),
    ).toBeDefined()
  })

  it('accepts controlled value and slot surfaces', () => {
    expect(
      SortPickerSchema.parse({
        id: 'sorter',
        value: { from: 'sort.selected' },
        options: [
          { value: 'recent', label: 'Most Recent', icon: 'clock' },
          { value: 'oldest', label: 'Oldest' },
        ],
        onSelect: { type: 'custom' },
        slots: {
          backdrop: {
            bg: 'rgba(0,0,0,0.6)',
          },
          panel: {
            bg: 'card',
          },
          option: {
            paddingY: 'sm',
            states: {
              selected: {
                bg: 'accent',
              },
            },
          },
          optionLabel: {
            letterSpacing: 'wide',
          },
          cancelLabel: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()
  })
})
