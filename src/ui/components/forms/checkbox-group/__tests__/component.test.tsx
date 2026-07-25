import { describe, expect, it } from 'vitest'
import React from 'react'
import { CheckboxGroup } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const OPTIONS = [
  { value: 'photo', label: 'Photography' },
  { value: 'travel', label: 'Travel' },
]

describe('CheckboxGroup', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <CheckboxGroup config={{ id: 'interests', options: OPTIONS }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders options', () => {
    const result = renderWithProviders(
      <CheckboxGroup config={{ id: 'interests', options: OPTIONS }} />,
    )
    expect(result.getByTestId('interests-option-photo')).toBeTruthy()
    expect(result.getByTestId('interests-option-travel')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <CheckboxGroup
        config={{
          id: 'interests',
          options: OPTIONS,
          slots: {
            optionsList: { gap: 'lg' },
            box: { borderRadius: 'lg' },
            optionLabel: { color: 'primary' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
