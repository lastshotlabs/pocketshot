import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { TypingIndicator } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('TypingIndicator', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the typing label from screen context', () => {
    const { getByText } = renderWithProviders(
      <TypingIndicator config={{ isTyping: { from: 'chat.typing' }, userName: { from: 'chat.user' } }} />,
      { initialValues: { chat: { typing: true, user: 'Taylor' } } },
    )
    expect(getByText('Taylor is typing')).toBeTruthy()
  })

  it('forwards test ids to dot nodes', () => {
    const { getByTestId } = renderWithProviders(
      <TypingIndicator config={{ isTyping: true, testID: 'typing-indicator' }} />,
    )
    expect(getByTestId('typing-indicator-dot-0')).toBeTruthy()
  })

  it('accepts shared styling props and named slots without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TypingIndicator
        config={{
          isTyping: true,
          userName: 'Taylor',
          color: 'muted',
          fontSize: 'sm',
          slots: {
            dot: { opacity: 0.8 },
            text: { textAlign: 'center' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
