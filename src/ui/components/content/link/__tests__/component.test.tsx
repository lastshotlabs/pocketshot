import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Link } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Link', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(
      <Link
        config={{ text: 'Click here', action: { type: 'open-url', url: 'https://example.com' } }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders text content', () => {
    const { getByText } = renderWithProviders(
      <Link
        config={{ text: 'Learn more', action: { type: 'open-url', url: 'https://example.com' } }}
      />,
    )
    expect(getByText('Learn more')).toBeTruthy()
  })

  it('has link accessibilityRole', () => {
    const { getByRole } = renderWithProviders(
      <Link config={{ text: 'Go somewhere', action: { type: 'navigate', to: '/Details' } }} />,
    )
    expect(getByRole('link')).toBeTruthy()
  })

  it('renders all size variants without crashing', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { getByText } = renderWithProviders(
        <Link
          config={{ text: size, size, action: { type: 'open-url', url: 'https://example.com' } }}
        />,
      )
      expect(getByText(size)).toBeTruthy()
    }
  })

  it('renders with underline true without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Link
        config={{
          text: 'Underlined link',
          underline: true,
          action: { type: 'open-url', url: 'https://example.com' },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with underline false without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Link
        config={{
          text: 'No underline',
          underline: false,
          action: { type: 'open-url', url: 'https://example.com' },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Link
        config={{
          text: 'Tagged link',
          action: { type: 'open-url', url: 'https://example.com' },
          testID: 'link-learn-more',
        }}
      />,
    )
    expect(getByTestId('link-learn-more')).toBeTruthy()
  })

  it('resolves text from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <Link
        config={{ text: { from: 'ctaLabel' }, action: { type: 'navigate', to: '/Profile' } }}
      />,
      { initialValues: { ctaLabel: 'View profile' } },
    )
    expect(getByText('View profile')).toBeTruthy()
  })

  it('accepts shared text styling props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Link
        config={{
          text: 'Styled link',
          action: { type: 'open-url', url: 'https://example.com' },
          color: 'success',
          fontSize: 'lg',
          textAlign: 'center',
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Link
        config={{
          text: 'Styled link',
          action: { type: 'open-url', url: 'https://example.com' },
          slots: {
            button: {
              paddingY: 'sm',
            },
            text: {
              letterSpacing: 'wide',
            },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
