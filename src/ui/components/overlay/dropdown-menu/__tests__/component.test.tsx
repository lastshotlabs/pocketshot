import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const CONFIG = {
  id: 'actions-menu',
  trigger: { label: 'Actions', icon: 'more' },
  items: [
    {
      id: 'edit',
      label: 'Edit',
      onPress: { type: 'set-value' as const, target: 'menu.edit', value: true },
    },
    {
      id: 'delete',
      label: 'Delete',
      destructive: true,
      onPress: { type: 'set-value' as const, target: 'menu.delete', value: true },
    },
  ],
  testID: 'actions-menu',
}

describe('DropdownMenu', () => {
  it('opens and renders items', () => {
    const result = renderWithProviders(<DropdownMenu config={CONFIG} />)

    const trigger = result.instance.root.find(
      (node) =>
        node.props.testID === 'actions-menu-trigger' && typeof node.props.onPress === 'function',
    )
    act(() => {
      trigger.props.onPress()
    })

    expect(result.getByText('Edit')).toBeTruthy()
    expect(result.getByTestId('dropdown-item-delete')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const result = renderWithProviders(
      <DropdownMenu
        config={{
          ...CONFIG,
          slots: {
            trigger: { paddingY: 'sm' },
            panel: { bg: 'card' },
          },
        }}
      />,
    )

    expect(result.toJSON()).toBeTruthy()
  })
})
