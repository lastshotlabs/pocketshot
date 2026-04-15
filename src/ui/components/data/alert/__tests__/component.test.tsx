import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { Alert } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Alert', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders title and body', () => {
    const { getByText } = renderWithProviders(
      <Alert config={{ title: 'Warning', body: 'Something changed' }} />,
    )
    expect(getByText('Warning')).toBeTruthy()
    expect(getByText('Something changed')).toBeTruthy()
  })

  it('renders action and dismiss controls when configured', () => {
    const { getByRole, getByText } = renderWithProviders(
      <Alert
        config={{
          title: 'Warning',
          dismissible: true,
          action: { label: 'Fix now', onPress: { type: 'toast', message: 'hi' } },
          testID: 'alert-main',
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
    expect(getByText('Fix now')).toBeTruthy()
  })

  it('accepts shared text styling props and slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Alert
        config={{
          title: 'Styled alert',
          body: 'Something changed',
          color: 'warning',
          fontSize: 'lg',
          slots: {
            root: { paddingX: 'lg' },
            title: { fontWeight: 'bold' },
            description: { textAlign: 'center' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
