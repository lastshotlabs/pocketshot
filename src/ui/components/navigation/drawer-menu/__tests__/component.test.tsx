import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { DrawerMenu } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const config = {
  id: 'app-drawer-menu',
  items: [
    { id: 'home', label: 'Home', icon: 'Home', section: 'Main', badge: 2 },
    { id: 'settings', label: 'Settings', icon: 'Settings', section: 'Main' },
  ],
  header: { title: 'Snapshot', subtitle: 'Workspace' },
  footer: { label: 'Sign out', onPress: { type: 'set-value' as const, target: 'auth.signout', value: true } },
}

describe('DrawerMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <DrawerMenu config={{ id: 'minimal-drawer-menu', items: [{ id: 'home', label: 'Home' }] }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders header, items, and footer when open', () => {
    const result = renderWithProviders(<DrawerMenu config={config} />, {
      initialValues: { '__drawerMenu_app-drawer-menu': true },
    })

    expect(result.getByText('Snapshot')).toBeTruthy()
    expect(result.getByText('Home')).toBeTruthy()
    expect(result.getByText('Sign out')).toBeTruthy()
    expect(result.getByTestId('drawer-menu-app-drawer-menu-panel')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <DrawerMenu
        config={{
          ...config,
          slots: {
            panel: { bg: 'card' },
            menuItemLabel: { letterSpacing: 'wide' },
            footerLabel: { color: 'muted' },
          },
        }}
      />,
      { initialValues: { '__drawerMenu_app-drawer-menu': true } },
    )

    expect(toJSON()).toBeTruthy()
  })
})
