import { describe, expect, it } from 'vitest'
import React from 'react'
import { PinInput } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('PinInput', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<PinInput config={{ id: 'pin' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the configured number of digit fields', () => {
    const result = renderWithProviders(<PinInput config={{ id: 'pin', length: 4 }} />)
    expect(result.getByTestId('pin-digit-0')).toBeTruthy()
    expect(result.getByTestId('pin-digit-3')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <PinInput
        config={{
          id: 'pin',
          slots: {
            boxRow: { gap: 'lg' },
            box: { borderRadius: 'lg' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
