import { describe, expect, it } from 'vitest'
import React from 'react'
import { RadioGroup } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

describe('RadioGroup', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<RadioGroup config={{ id: 'theme', options: OPTIONS }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders options', () => {
    const result = renderWithProviders(<RadioGroup config={{ id: 'theme', options: OPTIONS }} />)
    expect(result.getByTestId('theme-option-light')).toBeTruthy()
    expect(result.getByTestId('theme-option-dark')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <RadioGroup
        config={{
          id: 'theme',
          options: OPTIONS,
          slots: {
            optionsList: { gap: 'lg' },
            control: { borderRadius: 'full' },
            optionLabel: { color: 'primary' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
