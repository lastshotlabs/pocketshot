import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { View } from 'react-native'
import { ContextMenu } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const CONFIG = {
  id: 'file-menu',
  triggerLabel: 'File actions',
  items: [
    { id: 'open', label: 'Open', onPress: { type: 'set-value' as const, target: 'menu.open', value: true } },
    { id: 'delete', label: 'Delete', destructive: true, onPress: { type: 'set-value' as const, target: 'menu.delete', value: true } },
  ],
  testID: 'file-menu',
}

describe('ContextMenu', () => {
  it('opens on long press and renders items', () => {
    const result = renderWithProviders(
      <ContextMenu config={CONFIG}>
        <View />
      </ContextMenu>,
    )

    const trigger = result.instance.root.find(
      (node) => node.props.testID === 'file-menu-trigger' && typeof node.props.onLongPress === 'function',
    )
    act(() => {
      trigger.props.onLongPress()
    })

    expect(result.getByText('Open')).toBeTruthy()
    expect(result.getByTestId('context-menu-item-delete')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const result = renderWithProviders(
      <ContextMenu
        config={{
          ...CONFIG,
          slots: {
            panel: { bg: 'card' },
            itemLabel: { letterSpacing: 'wide' },
          },
        }}
      >
        <View />
      </ContextMenu>,
    )

    expect(result.toJSON()).toBeTruthy()
  })
})
