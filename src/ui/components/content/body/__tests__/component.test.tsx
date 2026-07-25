import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Body } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Body', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Body config={{ text: 'Hello world' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders text content', () => {
    const { getByText } = renderWithProviders(<Body config={{ text: 'Body text content' }} />)
    expect(getByText('Body text content')).toBeTruthy()
  })

  it('renders shared fontSize variants without crashing', () => {
    for (const fontSize of ['sm', 'base', 'lg', 'xl'] as const) {
      const { getByText } = renderWithProviders(
        <Body config={{ text: String(fontSize), fontSize }} />,
      )
      expect(getByText(String(fontSize))).toBeTruthy()
    }
  })

  it('renders shared fontWeight variants without crashing', () => {
    for (const fontWeight of ['normal', 'medium', 'semibold', 'bold'] as const) {
      const { getByText } = renderWithProviders(
        <Body config={{ text: String(fontWeight), fontWeight }} />,
      )
      expect(getByText(String(fontWeight))).toBeTruthy()
    }
  })

  it('renders all textAlign variants without crashing', () => {
    for (const textAlign of ['left', 'center', 'right', 'justify'] as const) {
      const { toJSON } = renderWithProviders(<Body config={{ text: 'Aligned', textAlign }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with custom color without crashing', () => {
    const { getByText } = renderWithProviders(
      <Body config={{ text: 'Colored', color: '#ff0000' }} />,
    )
    expect(getByText('Colored')).toBeTruthy()
  })

  it('renders with numberOfLines without crashing', () => {
    const { getByText } = renderWithProviders(
      <Body config={{ text: 'Clamped text', numberOfLines: 2 }} />,
    )
    expect(getByText('Clamped text')).toBeTruthy()
  })

  it('has accessibilityRole of text', () => {
    const { getByRole } = renderWithProviders(<Body config={{ text: 'Accessible' }} />)
    expect(getByRole('text')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Body config={{ text: 'Tagged', testID: 'body-test' }} />,
    )
    expect(getByTestId('body-test')).toBeTruthy()
  })

  it('resolves text from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(<Body config={{ text: { from: 'description' } }} />, {
      initialValues: { description: 'Resolved body text' },
    })
    expect(getByText('Resolved body text')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Body
        config={{
          text: 'Styled body',
          slots: {
            text: {
              letterSpacing: 'wide',
              color: 'muted',
            },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
