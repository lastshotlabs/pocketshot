import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { Drawer } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Drawer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Drawer config={{ id: 'drawer-a' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders panel and title when open', () => {
    const result = renderWithProviders(
      <Drawer config={{ id: 'drawer-b', title: 'Menu', content: 'Drawer content' }} />,
      { initialValues: { '__drawer_drawer-b': true } },
    )

    expect(result.getByText('Menu')).toBeTruthy()
    expect(result.getByText('Drawer content')).toBeTruthy()
    expect(result.getByTestId('drawer-drawer-b-panel')).toBeTruthy()
  })

  it('renders derived panel testID from config.testID when provided', () => {
    const result = renderWithProviders(
      <Drawer config={{ id: 'drawer-c', title: 'Menu', testID: 'main-drawer' }} />,
      { initialValues: { '__drawer_drawer-c': true } },
    )

    expect(result.getByTestId('main-drawer-panel')).toBeTruthy()
    expect(result.getByTestId('main-drawer-title')).toBeTruthy()
  })

  it('renders children inside the body', () => {
    const result = renderWithProviders(
      <Drawer config={{ id: 'drawer-d', title: 'Menu' }}>
        <Text>Custom child</Text>
      </Drawer>,
      { initialValues: { '__drawer_drawer-d': true } },
    )

    expect(result.getByText('Custom child')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Drawer
        config={{
          id: 'drawer-slots',
          title: 'Styled',
          slots: {
            panel: { bg: 'card' },
            title: { letterSpacing: 'wide' },
            body: { paddingY: 'lg' },
          },
        }}
      />,
      { initialValues: { '__drawer_drawer-slots': true } },
    )

    expect(toJSON()).toBeTruthy()
  })
})
