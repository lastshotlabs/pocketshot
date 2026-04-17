import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { ConfirmDialog } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const CONFIG = {
  id: 'confirm-delete',
  title: 'Delete item',
  message: 'This cannot be undone.',
  onConfirm: { type: 'set-value' as const, target: 'confirm.ok', value: true },
  onCancel: { type: 'set-value' as const, target: 'confirm.cancel', value: true },
  testID: 'confirm-delete',
}

describe('ConfirmDialog', () => {
  it('renders dialog content when open', () => {
    const result = renderWithProviders(<ConfirmDialog config={CONFIG} />, {
      initialValues: { ['__confirm_confirm-delete']: true },
    })

    expect(result.getByText('Delete item')).toBeTruthy()
    expect(result.getByTestId('confirm-delete-confirm')).toBeTruthy()
  })

  it('handles confirm press without crashing', () => {
    const result = renderWithProviders(<ConfirmDialog config={CONFIG} />, {
      initialValues: { ['__confirm_confirm-delete']: true },
    })

    const confirm = result.instance.root.find(
      (node) => node.props.testID === 'confirm-delete-confirm',
    )
    act(() => {
      confirm.props.onPress()
    })

    expect(result.toJSON()).toBeTruthy()
  })

  it('renders slot surfaces for destructive dialogs', () => {
    const result = renderWithProviders(
      <ConfirmDialog
        config={{
          ...CONFIG,
          variant: 'destructive',
          slots: {
            panel: {
              bg: 'card',
            },
            title: {
              letterSpacing: 'wide',
            },
            confirmText: {
              fontWeight: 'bold',
            },
          },
        }}
      />,
      { initialValues: { ['__confirm_confirm-delete']: true } },
    )

    expect(result.toJSON()).toBeTruthy()
  })
})
