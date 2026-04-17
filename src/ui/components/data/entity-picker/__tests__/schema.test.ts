import { describe, expect, it } from 'vitest'
import { EntityPickerSchema } from '../schema'

describe('EntityPickerSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      EntityPickerSchema.parse({
        id: 'assignee',
        data: [{ value: '1', label: 'Alice Adams' }],
      }),
    ).toBeDefined()
  })

  it('accepts from-ref data, value, and slot surfaces', () => {
    expect(
      EntityPickerSchema.parse({
        id: 'assignee',
        data: { from: 'people.options' },
        value: { from: 'people.selected' },
        slots: {
          trigger: {
            paddingY: 'sm',
          },
          searchInput: {
            bg: 'card',
          },
          entityRow: {
            paddingY: 'sm',
          },
          entityLabel: {
            letterSpacing: 'wide',
          },
          emptyText: {
            color: 'muted',
          },
        },
      }),
    ).toBeDefined()
  })
})
