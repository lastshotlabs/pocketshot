import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { EmptyState } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('EmptyState', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<EmptyState config={{ title: 'Nothing here yet' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the title text', () => {
    const { getByText } = renderWithProviders(<EmptyState config={{ title: 'No results found' }} />)
    expect(getByText('No results found')).toBeTruthy()
  })

  it('renders description when provided', () => {
    const { getByText } = renderWithProviders(
      <EmptyState config={{ title: 'No items', description: 'Try adding something first.' }} />,
    )
    expect(getByText('Try adding something first.')).toBeTruthy()
  })

  it('does not render description when omitted', () => {
    const { toJSON } = renderWithProviders(<EmptyState config={{ title: 'No items' }} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Try adding something first.')
  })

  it('renders icon text when provided', () => {
    const { getByText } = renderWithProviders(
      <EmptyState config={{ title: 'No items', icon: 'ðŸ“­' }} />,
    )
    expect(getByText('ðŸ“­')).toBeTruthy()
  })

  it('does not render icon when omitted', () => {
    const { toJSON } = renderWithProviders(<EmptyState config={{ title: 'No items' }} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('ðŸ“­')
  })

  it('renders action button when action is provided', () => {
    const { getByRole } = renderWithProviders(
      <EmptyState
        config={{
          title: 'No items',
          action: { label: 'Add Item', onPress: { type: 'navigate', to: '/Create' } },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('renders action label text', () => {
    const { getByText } = renderWithProviders(
      <EmptyState
        config={{
          title: 'No items',
          action: { label: 'Get Started', onPress: { type: 'navigate', to: '/Onboarding' } },
        }}
      />,
    )
    expect(getByText('Get Started')).toBeTruthy()
  })

  it('does not render action button when action is omitted', () => {
    const { toJSON } = renderWithProviders(<EmptyState config={{ title: 'No items' }} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('"button"')
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <EmptyState config={{ title: 'No items', testID: 'empty-state-main' }} />,
    )
    expect(getByTestId('empty-state-main')).toBeTruthy()
  })

  it('renders all elements together: icon + title + description + action', () => {
    const { getByText, getByRole } = renderWithProviders(
      <EmptyState
        config={{
          title: 'Empty inbox',
          description: 'No messages yet.',
          icon: 'âœ‰ï¸',
          action: { label: 'Compose', onPress: { type: 'navigate', to: '/Compose' } },
        }}
      />,
    )
    expect(getByText('âœ‰ï¸')).toBeTruthy()
    expect(getByText('Empty inbox')).toBeTruthy()
    expect(getByText('No messages yet.')).toBeTruthy()
    expect(getByText('Compose')).toBeTruthy()
    expect(getByRole('button')).toBeTruthy()
  })

  it('accepts shared text styling props and slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <EmptyState
        config={{
          title: 'Styled empty',
          description: 'Nothing to display',
          color: 'muted',
          fontSize: 'lg',
          slots: {
            root: { paddingY: 'xl' },
            title: { textAlign: 'center' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
