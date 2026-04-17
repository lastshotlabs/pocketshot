import { describe, expect, it } from 'vitest'
import React from 'react'
import { act } from 'react-test-renderer'
import { PhoneInput } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('PhoneInput', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<PhoneInput config={{ id: 'phone' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders country and number inputs', () => {
    const result = renderWithProviders(<PhoneInput config={{ id: 'phone' }} />)
    expect(result.getByTestId('phone-country')).toBeTruthy()
    expect(result.getByTestId('phone-number')).toBeTruthy()
  })

  it('renders picker slot surfaces without crashing when opened', () => {
    const result = renderWithProviders(
      <PhoneInput
        config={{
          id: 'phone',
          slots: {
            inputRow: { borderRadius: 'lg' },
            pickerPanel: { borderRadius: 'xl' },
            searchInput: { borderRadius: 'lg' },
            countryRowName: { color: 'primary' },
          },
        }}
      />,
    )

    const trigger = result.instance.root.find((node) => node.props.testID === 'phone-country')
    act(() => {
      trigger.props.onPress()
    })

    expect(result.getByText('Select Country')).toBeTruthy()
    expect(result.getByTestId('phone-search')).toBeTruthy()
  })
})
