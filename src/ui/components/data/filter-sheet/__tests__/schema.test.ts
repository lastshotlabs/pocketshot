import { describe, expect, it } from 'vitest'
import { FilterSheetSchema } from '../schema'

describe('FilterSheetSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      FilterSheetSchema.parse({
        id: 'filters',
        sections: [{ id: 'type', label: 'Type', type: 'select', options: [{ value: 'a', label: 'A' }] }],
        onApply: { type: 'set-value', target: 'filters.applied', value: true },
      }),
    ).toBeDefined()
  })

  it('accepts slot surfaces across sheet regions', () => {
    expect(
      FilterSheetSchema.parse({
        id: 'filters',
        sections: [{ id: 'type', label: 'Type', type: 'multi-select', options: [{ value: 'a', label: 'A' }] }],
        onApply: { type: 'set-value', target: 'filters.applied', value: true },
        onReset: { type: 'set-value', target: 'filters.reset', value: true },
        slots: {
          panel: { bg: 'card' },
          header: { paddingY: 'lg' },
          optionRow: {
            paddingY: 'sm',
            states: {
              selected: {
                bg: 'accent',
              },
            },
          },
          applyText: { letterSpacing: 'wide' },
        },
      }),
    ).toBeDefined()
  })
})
