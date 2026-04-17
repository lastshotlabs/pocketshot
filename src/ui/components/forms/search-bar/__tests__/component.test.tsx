import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { SearchBar } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('SearchBar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<SearchBar config={{ id: 'search' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders input and cancel button when configured', () => {
    const result = renderWithProviders(
      <SearchBar config={{ id: 'search', showCancelButton: true }} />,
    )
    expect(result.getByTestId('search-input')).toBeTruthy()
    expect(result.getByTestId('search-cancel')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <SearchBar
        config={{
          id: 'search',
          showCancelButton: true,
          slots: {
            inputContainer: { borderRadius: 'lg' },
            input: { letterSpacing: 'wide' },
            cancelText: { color: 'primary' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
