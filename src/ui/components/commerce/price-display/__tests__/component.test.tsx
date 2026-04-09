import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { PriceDisplay } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('PriceDisplay', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<PriceDisplay config={{ amount: 29.99 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the formatted price amount', () => {
    const { getByText } = renderWithProviders(<PriceDisplay config={{ amount: 29.99 }} />)
    expect(getByText('$29.99')).toBeTruthy()
  })

  it('renders a whole-number amount', () => {
    const { getByText } = renderWithProviders(<PriceDisplay config={{ amount: 100 }} />)
    expect(getByText('$100.00')).toBeTruthy()
  })

  it('renders amount passed as a numeric string', () => {
    const { getByText } = renderWithProviders(<PriceDisplay config={{ amount: '14.5' }} />)
    expect(getByText('$14.50')).toBeTruthy()
  })

  it('renders both current and original price when originalAmount is provided', () => {
    const { getByText } = renderWithProviders(
      <PriceDisplay config={{ amount: 39.99, originalAmount: 59.99 }} />,
    )
    expect(getByText('$39.99')).toBeTruthy()
    expect(getByText('$59.99')).toBeTruthy()
  })

  it('does not render a strikethrough price when originalAmount is omitted', () => {
    const { toJSON } = renderWithProviders(<PriceDisplay config={{ amount: 39.99 }} />)
    // No strikethrough style when no originalAmount
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('line-through')
  })

  it('renders the badge text when badge is provided', () => {
    const { getByText } = renderWithProviders(
      <PriceDisplay config={{ amount: 19.99, badge: '20% OFF' }} />,
    )
    expect(getByText('20% OFF')).toBeTruthy()
  })

  it('does not render a badge when badge is omitted', () => {
    const { toJSON } = renderWithProviders(<PriceDisplay config={{ amount: 19.99 }} />)
    expect(JSON.stringify(toJSON())).not.toContain('OFF')
  })

  it('renders all size variants without crashing', () => {
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      const { getByText } = renderWithProviders(<PriceDisplay config={{ amount: 9.99, size }} />)
      expect(getByText('$9.99')).toBeTruthy()
    }
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <PriceDisplay config={{ amount: 9.99, testID: 'price-main' }} />,
    )
    expect(getByTestId('price-main')).toBeTruthy()
  })

  it('resolves amount from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <PriceDisplay config={{ amount: { from: 'salePrice' } }} />,
      { initialValues: { salePrice: 74.99 } },
    )
    expect(getByText('$74.99')).toBeTruthy()
  })

  it('resolves originalAmount from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <PriceDisplay config={{ amount: 49.99, originalAmount: { from: 'listPrice' } }} />,
      { initialValues: { listPrice: 79.99 } },
    )
    expect(getByText('$79.99')).toBeTruthy()
  })

  it('renders a non-USD currency', () => {
    const { toJSON } = renderWithProviders(
      <PriceDisplay config={{ amount: 50, currency: 'GBP', locale: 'en-GB' }} />,
    )
    // The numeric amount must appear regardless of currency symbol rendering
    expect(JSON.stringify(toJSON())).toContain('50.00')
  })

  it('handles a non-parseable string amount gracefully', () => {
    // Should not throw; renders the raw string when NaN
    const { getByText } = renderWithProviders(<PriceDisplay config={{ amount: 'N/A' }} />)
    expect(getByText('N/A')).toBeTruthy()
  })
})
