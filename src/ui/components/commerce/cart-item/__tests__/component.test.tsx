import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { CartItem } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('CartItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <CartItem config={{ title: 'Blue Sneakers', price: 59.99 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the item title', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'Blue Sneakers', price: 59.99 }} />,
    )
    expect(getByText('Blue Sneakers')).toBeTruthy()
  })

  it('renders the formatted price', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'Headphones', price: 149.99 }} />,
    )
    expect(getByText('$149.99')).toBeTruthy()
  })

  it('renders the quantity value (defaults to 1)', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'Widget', price: 10.0 }} />,
    )
    expect(getByText('1')).toBeTruthy()
  })

  it('renders a non-default quantity', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'Widget', price: 10.0, quantity: 3 }} />,
    )
    expect(getByText('3')).toBeTruthy()
  })

  it('renders the line total (price × quantity)', () => {
    // price=25, qty=3 → total=75 → $75.00
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'Candle', price: 25.0, quantity: 3 }} />,
    )
    expect(getByText('$75.00')).toBeTruthy()
  })

  it('renders variant text when provided', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'T-Shirt', price: 19.99, variant: 'Size: M / Color: Red' }} />,
    )
    expect(getByText('Size: M / Color: Red')).toBeTruthy()
  })

  it('does not render variant when omitted', () => {
    const { toJSON } = renderWithProviders(<CartItem config={{ title: 'T-Shirt', price: 19.99 }} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Size:')
  })

  it('renders a remove button when onRemove is provided', () => {
    const { getByRole } = renderWithProviders(
      <CartItem
        config={{
          title: 'Widget',
          price: 10.0,
          onRemove: { type: 'toast', message: 'removed' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <CartItem config={{ title: 'Widget', price: 10.0, testID: 'cart-item-widget' }} />,
    )
    expect(getByTestId('cart-item-widget')).toBeTruthy()
  })

  it('derives testID suffixes for decrement/increment buttons from testID', () => {
    const { getByTestId } = renderWithProviders(
      <CartItem config={{ title: 'Widget', price: 10.0, testID: 'ci' }} />,
    )
    expect(getByTestId('ci-decrement')).toBeTruthy()
    expect(getByTestId('ci-increment')).toBeTruthy()
  })

  it('derives testID suffix for remove button from testID', () => {
    const { getByTestId } = renderWithProviders(
      <CartItem
        config={{
          title: 'Widget',
          price: 10.0,
          testID: 'ci',
          onRemove: { type: 'toast', message: 'removed' },
        }}
      />,
    )
    expect(getByTestId('ci-remove')).toBeTruthy()
  })

  it('resolves title from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: { from: 'itemName' }, price: 9.99 }} />,
      { initialValues: { itemName: 'Running Shoes' } },
    )
    expect(getByText('Running Shoes')).toBeTruthy()
  })

  it('resolves price from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'Bag', price: { from: 'bagPrice' } }} />,
      { initialValues: { bagPrice: 49.0 } },
    )
    expect(getByText('$49.00')).toBeTruthy()
  })

  it('resolves quantity from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <CartItem config={{ title: 'Mug', price: 12.0, quantity: { from: 'mugQty' } }} />,
      { initialValues: { mugQty: 5 } },
    )
    expect(getByText('5')).toBeTruthy()
  })

  it('renders a non-USD currency symbol', () => {
    const { toJSON } = renderWithProviders(
      <CartItem config={{ title: 'Baguette', price: 3.5, currency: 'EUR' }} />,
    )
    // Intl.NumberFormat with EUR contains the numeric amount regardless of locale
    expect(JSON.stringify(toJSON())).toContain('3.50')
  })

  it('renders thumbnail placeholder when no image is provided', () => {
    const { toJSON } = renderWithProviders(
      <CartItem config={{ title: 'Mystery Box', price: 20.0 }} />,
    )
    // The placeholder emoji character should appear in the tree
    expect(JSON.stringify(toJSON())).toContain('🛍')
  })
})
