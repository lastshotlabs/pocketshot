import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { Toggle } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Toggle', () => {
  it('renders label and toggles value', () => {
    const result = renderWithProviders(
      <Toggle config={{ id: 'feature-toggle', label: 'Feature', testID: 'feature-toggle' }} />,
    )

    const button = result.instance.root.find(
      (node) => node.props.testID === 'feature-toggle' && typeof node.props.onPress === 'function',
    )
    act(() => {
      button.props.onPress()
    })

    expect(result.getByText('Feature')).toBeTruthy()
  })

  it('hydrates refs and slot surfaces without crashing', () => {
    const result = renderWithProviders(
      <Toggle
        config={{
          id: 'feature-toggle',
          label: { from: 'toggle.label' },
          value: { from: 'toggle.value' },
          testID: 'feature-toggle',
          slots: {
            button: {
              paddingY: 'sm',
            },
            label: {
              letterSpacing: 'wide',
            },
          },
        }}
      />,
      { initialValues: { toggle: { label: 'Feature', value: true } } },
    )

    expect(result.toJSON()).toBeTruthy()
    expect(result.getByText('Feature')).toBeTruthy()
  })
})
