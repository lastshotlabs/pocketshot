import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ProductCard } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('ProductCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<ProductCard config={{ title: 'Wireless Keyboard' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the product title', () => {
    const { getByText } = renderWithProviders(
      <ProductCard config={{ title: 'Wireless Keyboard' }} />,
    )
    expect(getByText('Wireless Keyboard')).toBeTruthy()
  })

  it('renders the formatted price when provided', () => {
    const { getByText } = renderWithProviders(
      <ProductCard config={{ title: 'Wireless Keyboard', price: 89.99 }} />,
    )
    expect(getByText('$89.99')).toBeTruthy()
  })

  it('does not render a price when price is omitted', () => {
    const { toJSON } = renderWithProviders(
      <ProductCard config={{ title: 'Coming Soon Product' }} />,
    )
    expect(JSON.stringify(toJSON())).not.toContain('$')
  })

  it('renders the description when provided', () => {
    const { getByText } = renderWithProviders(
      <ProductCard config={{ title: 'Keyboard', description: 'Mechanical switches, backlit' }} />,
    )
    expect(getByText('Mechanical switches, backlit')).toBeTruthy()
  })

  it('does not render description when omitted', () => {
    const { toJSON } = renderWithProviders(<ProductCard config={{ title: 'Keyboard' }} />)
    expect(JSON.stringify(toJSON())).not.toContain('Mechanical')
  })

  it('renders the badge when provided', () => {
    const { getByText } = renderWithProviders(
      <ProductCard config={{ title: 'Keyboard', badge: 'NEW' }} />,
    )
    expect(getByText('NEW')).toBeTruthy()
  })

  it('does not render a badge when badge is omitted', () => {
    const { toJSON } = renderWithProviders(<ProductCard config={{ title: 'Keyboard' }} />)
    expect(JSON.stringify(toJSON())).not.toContain('NEW')
  })

  it('renders the image placeholder when no image is provided', () => {
    const { getByText } = renderWithProviders(<ProductCard config={{ title: 'Keyboard' }} />)
    expect(getByText('No Image')).toBeTruthy()
  })

  it('renders the review count when rating and reviewCount are provided', () => {
    const { getByText } = renderWithProviders(
      <ProductCard config={{ title: 'Keyboard', rating: 4, reviewCount: 128 }} />,
    )
    expect(getByText('(128)')).toBeTruthy()
  })

  it('does not render a review count when rating is omitted', () => {
    const { toJSON } = renderWithProviders(<ProductCard config={{ title: 'Keyboard' }} />)
    expect(JSON.stringify(toJSON())).not.toContain('(')
  })

  it('renders an Add button when onAddToCart is provided', () => {
    const { getByText } = renderWithProviders(
      <ProductCard
        config={{
          title: 'Keyboard',
          onAddToCart: { type: 'toast', message: 'added' },
        }}
      />,
    )
    expect(getByText('Add')).toBeTruthy()
  })

  it('does not render an Add button when onAddToCart is omitted', () => {
    const { toJSON } = renderWithProviders(<ProductCard config={{ title: 'Keyboard' }} />)
    expect(JSON.stringify(toJSON())).not.toContain('"Add"')
  })

  it('renders a pressable wrapper when onPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <ProductCard
        config={{
          title: 'Keyboard',
          onPress: { type: 'navigate', path: '/ProductDetail' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <ProductCard config={{ title: 'Keyboard', testID: 'product-keyboard' }} />,
    )
    expect(getByTestId('product-keyboard')).toBeTruthy()
  })

  it('derives testID for the add-to-cart button from testID', () => {
    const { getByTestId } = renderWithProviders(
      <ProductCard
        config={{
          title: 'Keyboard',
          testID: 'pk',
          onAddToCart: { type: 'toast', message: 'added' },
        }}
      />,
    )
    expect(getByTestId('pk-add-to-cart')).toBeTruthy()
  })

  it('resolves title from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <ProductCard config={{ title: { from: 'productName' } }} />,
      { initialValues: { productName: 'Ergonomic Chair' } },
    )
    expect(getByText('Ergonomic Chair')).toBeTruthy()
  })

  it('resolves price from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <ProductCard config={{ title: 'Chair', price: { from: 'chairPrice' } }} />,
      { initialValues: { chairPrice: 299.0 } },
    )
    expect(getByText('$299.00')).toBeTruthy()
  })

  it('resolves rating from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <ProductCard config={{ title: 'Chair', rating: { from: 'chairRating' }, reviewCount: 42 }} />,
      { initialValues: { chairRating: 3 } },
    )
    // rating section renders — review count text appears
    expect(JSON.stringify(toJSON())).toContain('(42)')
  })

  it('renders a non-USD currency', () => {
    const { toJSON } = renderWithProviders(
      <ProductCard config={{ title: 'Beret', price: 35, currency: 'EUR' }} />,
    )
    expect(JSON.stringify(toJSON())).toContain('35.00')
  })
})
