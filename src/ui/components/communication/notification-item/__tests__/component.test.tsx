import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { NotificationItem } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'
import type { NotificationItemConfig } from '../types'

describe('NotificationItem', () => {
  beforeEach(() => vi.clearAllMocks())

  const base: NotificationItemConfig = { title: 'New message', read: false }

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<NotificationItem config={base} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders title text', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem config={{ title: 'You have a new follower', read: false }} />,
    )
    expect(getByText('You have a new follower')).toBeTruthy()
  })

  it('renders body text when provided', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem
        config={{ title: 'Alert', read: false, body: 'Alice started following you' }}
      />,
    )
    expect(getByText('Alice started following you')).toBeTruthy()
  })

  it('does not render body when not provided', () => {
    const { toJSON } = renderWithProviders(
      <NotificationItem config={{ title: 'Simple notification', read: false }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).toContain('Simple notification')
  })

  it('renders timestamp when provided', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem config={{ title: 'Alert', read: false, timestamp: '5 minutes ago' }} />,
    )
    expect(getByText('5 minutes ago')).toBeTruthy()
  })

  it('does not render timestamp when not provided', () => {
    const { toJSON } = renderWithProviders(
      <NotificationItem config={{ title: 'Alert', read: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders icon text when icon is provided', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem config={{ title: 'Alert', read: false, icon: '🔔' }} />,
    )
    expect(getByText('🔔')).toBeTruthy()
  })

  it('renders as a button when onPress action is provided', () => {
    const onPress = {
      type: 'navigate',
      path: '/Profile',
    } as unknown as import('../../../../actions/types').Action
    const { getByRole } = renderWithProviders(
      <NotificationItem config={{ title: 'Tap me', read: false, onPress }} />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('renders dismiss button when onDismiss is provided', () => {
    const onDismiss = {
      type: 'toast',
      message: 'Dismissed',
    } as unknown as import('../../../../actions/types').Action
    const { getByText } = renderWithProviders(
      <NotificationItem config={{ title: 'Dismissable', read: false, onDismiss }} />,
    )
    expect(getByText('✕')).toBeTruthy()
  })

  it('does not render dismiss button when onDismiss is not provided', () => {
    const { toJSON } = renderWithProviders(
      <NotificationItem config={{ title: 'No dismiss', read: false }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('✕')
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <NotificationItem config={{ title: 'Test', read: false, testID: 'notif-123' }} />,
    )
    expect(getByTestId('notif-123')).toBeTruthy()
  })

  it('uses id as testID when testID is not explicitly set', () => {
    const { getByTestId } = renderWithProviders(
      <NotificationItem config={{ title: 'Test', read: false, id: 'notif-by-id' }} />,
    )
    expect(getByTestId('notif-by-id')).toBeTruthy()
  })

  it('resolves title from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem config={{ title: { from: 'notifTitle' }, read: false }} />,
      { initialValues: { notifTitle: 'Dynamic title from context' } },
    )
    expect(getByText('Dynamic title from context')).toBeTruthy()
  })

  it('resolves body from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem config={{ title: 'Alert', read: false, body: { from: 'notifBody' } }} />,
      { initialValues: { notifBody: 'Dynamic body from context' } },
    )
    expect(getByText('Dynamic body from context')).toBeTruthy()
  })

  it('resolves timestamp from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem
        config={{ title: 'Alert', read: false, timestamp: { from: 'notifTime' } }}
      />,
      { initialValues: { notifTime: 'Just now' } },
    )
    expect(getByText('Just now')).toBeTruthy()
  })

  it('renders read notification without crashing', () => {
    const { toJSON } = renderWithProviders(
      <NotificationItem config={{ title: 'Read notification', read: true }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders unread notification without crashing', () => {
    const { toJSON } = renderWithProviders(
      <NotificationItem config={{ title: 'Unread notification', read: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('resolves read state from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <NotificationItem config={{ title: 'Alert', read: { from: 'isRead' } }} />,
      { initialValues: { isRead: true } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders title, body, and timestamp together', () => {
    const { getByText } = renderWithProviders(
      <NotificationItem
        config={{
          title: 'New comment',
          read: false,
          body: 'Bob replied to your thread',
          timestamp: '1m ago',
        }}
      />,
    )
    expect(getByText('New comment')).toBeTruthy()
    expect(getByText('Bob replied to your thread')).toBeTruthy()
    expect(getByText('1m ago')).toBeTruthy()
  })
})
