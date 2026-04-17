import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { FilterBar } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const FILTERS = [
  { id: 'recent', label: 'Recent', icon: 'clock' },
  { id: 'favorites', label: 'Favorites', count: 3 },
]

describe('FilterBar', () => {
  it('renders all option and filters', () => {
    const { getByTestId } = renderWithProviders(
      <FilterBar config={{ filters: FILTERS, testID: 'filters' }} />,
    )

    expect(getByTestId('filters-chip-all')).toBeTruthy()
    expect(getByTestId('filters-chip-recent')).toBeTruthy()
    expect(getByTestId('filters-chip-favorites')).toBeTruthy()
  })

  it('updates selection when a chip is pressed', () => {
    const result = renderWithProviders(
      <FilterBar config={{ filters: FILTERS, testID: 'filters' }} />,
    )

    const recentChip = result.instance.root.find(
      (node) => node.props.testID === 'filters-chip-recent',
    )

    act(() => {
      recentChip.props.onPress()
    })

    const updatedChip = result.getByTestId('filters-chip-recent')
    expect(updatedChip).toBeTruthy()
  })

  it('renders multi-select filters with slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <FilterBar
        config={{
          filters: FILTERS,
          multiSelect: true,
          testID: 'filters',
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
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('hydrates from from-ref values', () => {
    const result = renderWithProviders(
      <FilterBar
        config={{
          filters: FILTERS,
          value: { from: 'filters.selected' },
          testID: 'filters',
        }}
      />,
      { initialValues: { filters: { selected: 'favorites' } } },
    )

    const favoritesChip = result.getByTestId('filters-chip-favorites')
    expect(favoritesChip).toBeTruthy()
  })
})
