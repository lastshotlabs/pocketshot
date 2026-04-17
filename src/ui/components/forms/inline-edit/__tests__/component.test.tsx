import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { InlineEdit } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('InlineEdit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the committed value', () => {
    const { getByText } = renderWithProviders(
      <InlineEdit config={{ id: 'price', defaultValue: '42' }} />,
    )

    expect(getByText('42')).toBeTruthy()
    expect(getByText('Edit')).toBeTruthy()
  })

  it('renders ref-backed affixes', () => {
    const { getByText } = renderWithProviders(
      <InlineEdit config={{ id: 'price', prefix: { from: 'copy.prefix' }, suffix: { from: 'copy.suffix' } }} />,
      { initialValues: { copy: { prefix: '$', suffix: 'USD' } } },
    )

    expect(getByText('$')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <InlineEdit config={{ id: 'price', testID: 'inline-price' }} />,
    )

    expect(getByTestId('inline-price')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <InlineEdit
        config={{
          id: 'price',
          slots: {
            displayText: { letterSpacing: 'wide' },
            editRow: { borderRadius: 'lg' },
            confirmText: { color: 'success' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
