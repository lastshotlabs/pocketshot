import { describe, expect, it } from 'vitest'
import React from 'react'
import { Slider } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Slider', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Slider config={{ id: 'volume' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders label and value text', () => {
    const result = renderWithProviders(
      <Slider config={{ id: 'volume', label: 'Volume', defaultValue: 40 }} />,
    )
    expect(result.getByText('Volume')).toBeTruthy()
    expect(result.getByText('40')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Slider
        config={{
          id: 'volume',
          slots: {
            header: { paddingY: 'sm' },
            track: { borderRadius: 'full' },
            thumb: { borderRadius: 'full' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
