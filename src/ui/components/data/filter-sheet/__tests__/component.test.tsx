import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { FilterSheet } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const CONFIG = {
  id: 'filters',
  sections: [
    {
      id: 'type',
      label: 'Type',
      type: 'select' as const,
      options: [{ value: 'a', label: 'Alpha' }],
    },
    { id: 'featured', label: 'Featured', type: 'toggle' as const },
  ],
  onApply: { type: 'set-value' as const, target: 'filters.applied', value: true },
  onReset: { type: 'set-value' as const, target: 'filters.reset', value: true },
  testID: 'filters',
}

describe('FilterSheet', () => {
  it('renders sheet controls when open', () => {
    const { getByText, getByTestId } = renderWithProviders(<FilterSheet config={CONFIG} />, {
      initialValues: { __filterSheet_filters: true },
    })

    expect(getByText('Filters')).toBeTruthy()
    expect(getByTestId('filters-type-a')).toBeTruthy()
    expect(getByTestId('filters-apply')).toBeTruthy()
  })

  it('applies filters without crashing', () => {
    const result = renderWithProviders(<FilterSheet config={CONFIG} />, {
      initialValues: { __filterSheet_filters: true },
    })

    const option = result.instance.root.find((node) => node.props.testID === 'filters-type-a')
    act(() => {
      option.props.onPress()
    })

    const apply = result.instance.root.find((node) => node.props.testID === 'filters-apply')
    act(() => {
      apply.props.onPress()
    })

    expect(result.toJSON()).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <FilterSheet
        config={{
          ...CONFIG,
          slots: {
            panel: {
              bg: 'card',
            },
            optionRow: {
              paddingY: 'sm',
            },
            applyText: {
              letterSpacing: 'wide',
            },
          },
        }}
      />,
      { initialValues: { __filterSheet_filters: true } },
    )

    expect(toJSON()).toBeTruthy()
  })
})
