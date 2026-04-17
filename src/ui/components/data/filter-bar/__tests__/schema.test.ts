import { describe, expect, it } from 'vitest'
import { FilterBarSchema } from '../schema'

describe('FilterBarSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      FilterBarSchema.parse({
        filters: [
          { id: 'all', label: 'All' },
          { id: 'favorites', label: 'Favorites', count: 3 },
        ],
      }),
    ).toBeDefined()
  })

  it('accepts from-ref values and slot surfaces', () => {
    expect(
      FilterBarSchema.parse({
        id: 'filter-bar',
        filters: [
          { id: 'recent', label: 'Recent', icon: 'clock' },
          { id: 'starred', label: 'Starred', count: 12 },
        ],
        value: { from: 'filters.selected' },
        slots: {
          track: {
            paddingX: 'lg',
          },
          chip: {
            paddingY: 'sm',
            states: {
              selected: {
                bg: 'primary',
              },
            },
          },
          chipLabel: {
            letterSpacing: 'wide',
          },
          countBadge: {
            bg: 'muted',
          },
          countLabel: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()
  })
})
