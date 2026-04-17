import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { BottomTabBar } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const config = {
  id: 'main-tabs',
  tabs: [
    { id: 'home', label: 'Home', icon: 'Home', badge: 2, onPress: { type: 'set-value' as const, target: 'tabs.home', value: true } },
    { id: 'profile', label: 'Profile', icon: 'Profile', onPress: { type: 'set-value' as const, target: 'tabs.profile', value: true } },
  ],
}

describe('BottomTabBar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<BottomTabBar config={config} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders tab labels and testIDs', () => {
    const result = renderWithProviders(<BottomTabBar config={config} />)
    expect(result.getByText('Home')).toBeTruthy()
    expect(result.getByText('Profile')).toBeTruthy()
    expect(result.getByTestId('main-tabs-home')).toBeTruthy()
    expect(result.getByTestId('main-tabs-profile')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <BottomTabBar
        config={{
          ...config,
          slots: {
            tab: { paddingY: 'sm' },
            label: { letterSpacing: 'wide' },
            indicator: { borderRadius: 'full' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
