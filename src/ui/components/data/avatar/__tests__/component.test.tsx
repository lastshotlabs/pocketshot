import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Avatar } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Avatar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Avatar config={{ size: 'md', shape: 'circle' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders initials when no src is provided', () => {
    const { getByText } = renderWithProviders(
      <Avatar config={{ name: 'Jane Doe', size: 'md', shape: 'circle' }} />,
    )
    expect(getByText('JD')).toBeTruthy()
  })

  it('renders single-word name as one initial', () => {
    const { getByText } = renderWithProviders(
      <Avatar config={{ name: 'Alice', size: 'md', shape: 'circle' }} />,
    )
    expect(getByText('A')).toBeTruthy()
  })

  it('renders fallback initial when no name is provided', () => {
    const { getByText } = renderWithProviders(<Avatar config={{ size: 'md', shape: 'circle' }} />)
    expect(getByText('?')).toBeTruthy()
  })

  it('renders all size variants without crashing', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      const { toJSON } = renderWithProviders(
        <Avatar config={{ name: 'Test User', size, shape: 'circle' }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders all shape variants without crashing', () => {
    for (const shape of ['circle', 'rounded', 'square'] as const) {
      const { toJSON } = renderWithProviders(
        <Avatar config={{ name: 'Test User', size: 'md', shape }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Avatar config={{ size: 'md', shape: 'circle', testID: 'avatar-me' }} />,
    )
    expect(getByTestId('avatar-me')).toBeTruthy()
  })

  it('renders a pressable button when onPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <Avatar
        config={{
          name: 'Jane',
          size: 'md',
          shape: 'circle',
          onPress: { type: 'navigate', to: '/Profile' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('does not render a button when onPress is absent', () => {
    const { toJSON } = renderWithProviders(
      <Avatar config={{ name: 'Jane', size: 'md', shape: 'circle' }} />,
    )
    const json = JSON.stringify(toJSON())
    // TouchableOpacity emits accessibilityRole="button" only when onPress is set
    expect(json).not.toContain('"button"')
  })

  it('resolves name from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <Avatar config={{ name: { from: 'userName' }, size: 'md', shape: 'circle' }} />,
      { initialValues: { userName: 'Bob Smith' } },
    )
    expect(getByText('BS')).toBeTruthy()
  })

  it('resolves src from screen context via from-ref and renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Avatar config={{ src: { from: 'avatarUrl' }, name: 'Bob', size: 'md', shape: 'circle' }} />,
      { initialValues: { avatarUrl: 'https://example.com/avatar.jpg' } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('accepts named slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Avatar
        config={{
          name: 'Jane Doe',
          size: 'md',
          shape: 'circle',
          slots: {
            initials: { letterSpacing: 'wide' },
            fallback: { bg: 'muted' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
