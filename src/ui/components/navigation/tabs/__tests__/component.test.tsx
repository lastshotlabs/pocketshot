import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Tabs } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const baseTabs = [
  { id: 'feed', label: 'Feed' },
  { id: 'explore', label: 'Explore' },
  { id: 'profile', label: 'Profile' },
]

describe('Tabs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Tabs config={{ id: 'nav', tabs: baseTabs }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders all tab labels', () => {
    const { getByText } = renderWithProviders(<Tabs config={{ id: 'nav', tabs: baseTabs }} />)
    expect(getByText('Feed')).toBeTruthy()
    expect(getByText('Explore')).toBeTruthy()
    expect(getByText('Profile')).toBeTruthy()
  })

  it('renders tab icons when provided', () => {
    const tabsWithIcons = [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'search', label: 'Search', icon: '🔍' },
    ]
    const { getByText } = renderWithProviders(<Tabs config={{ id: 'nav', tabs: tabsWithIcons }} />)
    expect(getByText('🏠')).toBeTruthy()
    expect(getByText('🔍')).toBeTruthy()
  })

  it('applies testID prefix to each tab', () => {
    const { getByTestId } = renderWithProviders(
      <Tabs config={{ id: 'nav', tabs: baseTabs, testID: 'bottom-tabs' }} />,
    )
    expect(getByTestId('bottom-tabs-feed')).toBeTruthy()
    expect(getByTestId('bottom-tabs-explore')).toBeTruthy()
    expect(getByTestId('bottom-tabs-profile')).toBeTruthy()
  })

  it('uses id-based testID when testID is not provided', () => {
    const { getByTestId } = renderWithProviders(<Tabs config={{ id: 'nav', tabs: baseTabs }} />)
    expect(getByTestId('nav-feed')).toBeTruthy()
    expect(getByTestId('nav-explore')).toBeTruthy()
    expect(getByTestId('nav-profile')).toBeTruthy()
  })

  it('applies wrapper testID when testID is set', () => {
    const { getByTestId } = renderWithProviders(
      <Tabs config={{ id: 'nav', tabs: baseTabs, testID: 'tab-bar' }} />,
    )
    expect(getByTestId('tab-bar')).toBeTruthy()
  })

  it('selects the first tab by default when no defaultTab is set', () => {
    const { getByTestId } = renderWithProviders(
      <Tabs config={{ id: 'nav', tabs: baseTabs, testID: 'nav' }} />,
    )
    const feedTab = getByTestId('nav-feed')
    expect((feedTab as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('applies defaultTab as the initially selected tab', () => {
    const { getByTestId } = renderWithProviders(
      <Tabs config={{ id: 'nav', tabs: baseTabs, defaultTab: 'explore', testID: 'nav' }} />,
    )
    const exploreTab = getByTestId('nav-explore')
    expect((exploreTab as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('marks non-active tabs as not selected', () => {
    const { getByTestId } = renderWithProviders(
      <Tabs config={{ id: 'nav', tabs: baseTabs, defaultTab: 'feed', testID: 'nav' }} />,
    )
    const exploreTab = getByTestId('nav-explore')
    expect((exploreTab as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: false,
    })
  })

  it('resolves activeTab from screen context via from-ref', () => {
    const { getByTestId } = renderWithProviders(
      <Tabs
        config={{ id: 'nav', tabs: baseTabs, activeTab: { from: 'currentTab' }, testID: 'nav' }}
      />,
      { initialValues: { currentTab: 'profile' } },
    )
    const profileTab = getByTestId('nav-profile')
    expect((profileTab as { props: Record<string, unknown> }).props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('renders all tab variants without crashing', () => {
    const variants = ['default', 'pills', 'underline'] as const
    for (const variant of variants) {
      const { toJSON } = renderWithProviders(
        <Tabs config={{ id: 'nav', tabs: baseTabs, variant }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with two tabs', () => {
    const twoTabs = [
      { id: 'map', label: 'Map' },
      { id: 'list', label: 'List' },
    ]
    const { getByText } = renderWithProviders(<Tabs config={{ id: 'view', tabs: twoTabs }} />)
    expect(getByText('Map')).toBeTruthy()
    expect(getByText('List')).toBeTruthy()
  })
})
