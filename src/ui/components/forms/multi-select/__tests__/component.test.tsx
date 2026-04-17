import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { MultiSelect } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('MultiSelect', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the placeholder', () => {
    const { getByText } = renderWithProviders(
      <MultiSelect config={{ id: 'themes', options: [{ value: 'light', label: 'Light' }] }} />,
    )

    expect(getByText('Select options...')).toBeTruthy()
  })

  it('renders a ref-backed label', () => {
    const { getByText } = renderWithProviders(
      <MultiSelect
        config={{
          id: 'themes',
          options: [{ value: 'light', label: 'Light' }],
          label: { from: 'copy.label' },
        }}
      />,
      { initialValues: { copy: { label: 'Themes' } } },
    )

    expect(getByText('Themes')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <MultiSelect
        config={{
          id: 'themes',
          options: [{ value: 'light', label: 'Light' }],
          testID: 'theme-select',
        }}
      />,
    )

    expect(getByTestId('theme-select')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <MultiSelect
        config={{
          id: 'themes',
          options: [{ value: 'light', label: 'Light' }],
          slots: {
            trigger: { borderRadius: 'lg' },
            optionLabel: { color: 'primary' },
            doneButton: { borderRadius: 'md' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
