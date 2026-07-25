import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { SortPicker } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const OPTIONS = [
  { value: 'recent', label: 'Most Recent', icon: 'clock' },
  { value: 'oldest', label: 'Oldest' },
]
const ON_SELECT = { type: 'set-value' as const, target: 'sort.selected', value: 'recent' }

describe('SortPicker', () => {
  it('renders options and cancel action when open', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <SortPicker
        config={{ id: 'sorter', options: OPTIONS, onSelect: ON_SELECT, testID: 'sorter' }}
      />,
      { initialValues: { __sortPicker_sorter: true } },
    )

    expect(getByText('Sort by')).toBeTruthy()
    expect(getByTestId('sorter-option-recent')).toBeTruthy()
    expect(getByTestId('sorter-cancel')).toBeTruthy()
  })

  it('selects an option without crashing', () => {
    const result = renderWithProviders(
      <SortPicker
        config={{ id: 'sorter', options: OPTIONS, onSelect: ON_SELECT, testID: 'sorter' }}
      />,
      { initialValues: { __sortPicker_sorter: true } },
    )

    const option = result.instance.root.find((node) => node.props.testID === 'sorter-option-recent')

    act(() => {
      option.props.onPress()
    })

    expect(result.toJSON()).toBeTruthy()
  })

  it('hydrates the selected option from from-ref values and slot surfaces', () => {
    const { getByTestId, toJSON } = renderWithProviders(
      <SortPicker
        config={{
          id: 'sorter',
          options: OPTIONS,
          value: { from: 'sort.selected' },
          onSelect: ON_SELECT,
          testID: 'sorter',
          slots: {
            panel: {
              bg: 'card',
            },
            option: {
              paddingY: 'sm',
            },
            optionLabel: {
              letterSpacing: 'wide',
            },
          },
        }}
      />,
      { initialValues: { __sortPicker_sorter: true, sort: { selected: 'oldest' } } },
    )

    expect(toJSON()).toBeTruthy()
    expect(getByTestId('sorter-option-oldest')).toBeTruthy()
  })
})
