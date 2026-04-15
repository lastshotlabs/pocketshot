import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { NotificationBell } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('NotificationBell', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a badge count from screen context', () => {
    const { getByText, getByRole } = renderWithProviders(
      <NotificationBell config={{ count: { from: 'notifications.unread' } }} />,
      { initialValues: { notifications: { unread: 3 } } },
    )
    expect(getByRole('button')).toBeTruthy()
    expect(getByText('3')).toBeTruthy()
  })

  it('renders as a button when onPress is configured', () => {
    const { getByRole } = renderWithProviders(
      <NotificationBell config={{ count: 2, onPress: { type: 'toast', message: 'hi' } }} />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('accepts shared text styling props and slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <NotificationBell
        config={{
          count: 120,
          color: 'primary',
          fontSize: 'lg',
          slots: {
            button: { paddingX: 'sm' },
            badge: { bg: 'warning' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
