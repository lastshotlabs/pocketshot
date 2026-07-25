import { describe, expect, it } from 'vitest'
import React from 'react'
import { PricingTable } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const navigateSignup = {
  type: 'navigate',
  to: '/signup',
} as unknown as import('../../../../actions/types').Action
const navigateCheckout = {
  type: 'navigate',
  to: '/checkout',
} as unknown as import('../../../../actions/types').Action

const CONFIG = {
  title: 'Plans',
  subtitle: 'Choose one',
  tiers: [
    {
      id: 'starter',
      name: 'Starter',
      price: '$0',
      features: ['One project'],
      cta: { label: 'Start Free', onPress: navigateSignup },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$12',
      period: '/month',
      description: 'For teams',
      features: ['Unlimited projects'],
      cta: { label: 'Choose Pro', onPress: navigateCheckout },
      highlighted: true,
    },
  ],
}

describe('PricingTable', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<PricingTable config={CONFIG} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders title and tiers', () => {
    const result = renderWithProviders(<PricingTable config={CONFIG} />)
    expect(result.getByText('Plans')).toBeTruthy()
    expect(result.getByText('Starter')).toBeTruthy()
    expect(result.getByText('Pro')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <PricingTable
        config={{
          ...CONFIG,
          slots: {
            card: { borderRadius: 'xl' },
            title: { letterSpacing: 'wide' },
            ctaButton: { borderRadius: 'lg' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
