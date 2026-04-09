import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ChatBubble } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'
import type { ChatBubbleConfig } from '../types'

describe('ChatBubble', () => {
  beforeEach(() => vi.clearAllMocks())

  const base: ChatBubbleConfig = { message: 'Hello', isOwn: false }

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<ChatBubble config={base} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders message text', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Hello world', isOwn: false }} />,
    )
    expect(getByText('Hello world')).toBeTruthy()
  })

  it('renders as own message (isOwn=true) without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ChatBubble config={{ message: 'My message', isOwn: true }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders as other message (isOwn=false) without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ChatBubble config={{ message: 'Their message', isOwn: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders message text for isOwn=true', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Sent by me', isOwn: true }} />,
    )
    expect(getByText('Sent by me')).toBeTruthy()
  })

  it('renders message text for isOwn=false', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Sent by other', isOwn: false }} />,
    )
    expect(getByText('Sent by other')).toBeTruthy()
  })

  it('renders timestamp when provided', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Hello', isOwn: false, timestamp: '12:34 PM' }} />,
    )
    expect(getByText('12:34 PM')).toBeTruthy()
  })

  it('renders status sent indicator when isOwn=true and status=sent', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Hi', isOwn: true, status: 'sent' }} />,
    )
    expect(getByText('✓')).toBeTruthy()
  })

  it('renders status read indicator when isOwn=true and status=read', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Hi', isOwn: true, status: 'read' }} />,
    )
    expect(getByText('✓✓')).toBeTruthy()
  })

  it('renders status error indicator when isOwn=true and status=error', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Hi', isOwn: true, status: 'error' }} />,
    )
    expect(getByText('⚠')).toBeTruthy()
  })

  it('does not render status indicator when isOwn=false', () => {
    const { toJSON } = renderWithProviders(
      <ChatBubble config={{ message: 'Hi', isOwn: false, status: 'read' }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('✓✓')
  })

  it('renders with avatar src without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ChatBubble
        config={{
          message: 'Hi',
          isOwn: false,
          avatar: { src: 'https://example.com/avatar.png', name: 'Alice' },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders avatar initials fallback when no src', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble
        config={{
          message: 'Hi',
          isOwn: false,
          avatar: { name: 'Alice' },
        }}
      />,
    )
    expect(getByText('AL')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <ChatBubble config={{ message: 'Hi', isOwn: false, testID: 'bubble-123' }} />,
    )
    expect(getByTestId('bubble-123')).toBeTruthy()
  })

  it('resolves message from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: { from: 'chatMessage' }, isOwn: false }} />,
      { initialValues: { chatMessage: 'Hello from context' } },
    )
    expect(getByText('Hello from context')).toBeTruthy()
  })

  it('resolves isOwn from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble
        config={{
          message: 'Status test',
          isOwn: { from: 'isMine' },
          status: 'sent',
        }}
      />,
      { initialValues: { isMine: true } },
    )
    // status indicator only renders for own messages
    expect(getByText('✓')).toBeTruthy()
  })

  it('resolves timestamp from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <ChatBubble config={{ message: 'Hi', isOwn: false, timestamp: { from: 'msgTime' } }} />,
      { initialValues: { msgTime: '3:45 PM' } },
    )
    expect(getByText('3:45 PM')).toBeTruthy()
  })

  it('renders message with accessibilityRole text', () => {
    const { getByRole } = renderWithProviders(
      <ChatBubble config={{ message: 'Accessible message', isOwn: false }} />,
    )
    expect(getByRole('text')).toBeTruthy()
  })

  it('renders all status variants without crashing', () => {
    const statuses = ['sending', 'sent', 'read', 'error'] as const
    for (const status of statuses) {
      const { toJSON } = renderWithProviders(
        <ChatBubble config={{ message: 'Test', isOwn: true, status }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })
})
