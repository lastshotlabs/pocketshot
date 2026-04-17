import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { Popover } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Popover', () => {
  it('opens and renders content', () => {
    const result = renderWithProviders(
      <Popover
        config={{ id: 'info-popover', triggerLabel: 'Open', content: 'Details', testID: 'info' }}
      />,
    )

    const trigger = result.instance.root.find((node) => node.props.testID === 'info-trigger')
    act(() => {
      trigger.props.onPress()
    })

    expect(result.getByText('Details')).toBeTruthy()
    expect(result.getByTestId('info-close')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const result = renderWithProviders(
      <Popover
        config={{
          id: 'info-popover',
          triggerLabel: 'Open',
          content: 'Details',
          position: 'left',
          testID: 'info',
          slots: {
            trigger: {
              paddingY: 'sm',
            },
            panel: {
              bg: 'card',
            },
          },
        }}
      />,
    )

    expect(result.toJSON()).toBeTruthy()
  })
})
