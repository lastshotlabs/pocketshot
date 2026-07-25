import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { TopBar } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('TopBar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<TopBar config={{ title: 'Home' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders title and subtitle', () => {
    const result = renderWithProviders(
      <TopBar config={{ title: 'Home', subtitle: 'Welcome back' }} />,
    )
    expect(result.getByText('Home')).toBeTruthy()
    expect(result.getByText('Welcome back')).toBeTruthy()
  })

  it('renders preset left action and right actions', () => {
    const result = renderWithProviders(
      <TopBar
        config={{
          id: 'main-top-bar',
          title: 'Home',
          leftAction: 'back',
          rightActions: [
            {
              icon: 'Bell',
              onPress: { type: 'set-value', target: 'bell.open', value: true },
              badge: 3,
            },
          ],
        }}
      />,
    )

    expect(result.getByTestId('main-top-bar-left-back')).toBeTruthy()
    expect(result.getByTestId('main-top-bar-right-action-0')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TopBar
        config={{
          id: 'styled-top-bar',
          title: 'Styled',
          slots: {
            row: { paddingY: 'sm' },
            title: { letterSpacing: 'wide' },
            iconText: { color: 'primary' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
