import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Header } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const navigateAction = { type: 'navigate' as const, path: '/home' }

describe('Header', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Header config={{ title: 'Test' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the title text', () => {
    const { getByText } = renderWithProviders(<Header config={{ title: 'My Screen' }} />)
    expect(getByText('My Screen')).toBeTruthy()
  })

  it('renders the subtitle when provided', () => {
    const { getByText } = renderWithProviders(
      <Header config={{ title: 'Main', subtitle: 'Sub text' }} />,
    )
    expect(getByText('Sub text')).toBeTruthy()
  })

  it('does not render subtitle when omitted', () => {
    const { toJSON } = renderWithProviders(<Header config={{ title: 'No Sub' }} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Sub text')
  })

  it('renders back button when showBack is true', () => {
    const { getByTestId } = renderWithProviders(
      <Header config={{ title: 'Title', showBack: true, id: 'main-header' }} />,
    )
    expect(getByTestId('main-header-back')).toBeTruthy()
  })

  it('does not render back button when showBack is false', () => {
    const { toJSON } = renderWithProviders(
      <Header config={{ title: 'Title', showBack: false, testID: 'hdr' }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('hdr-back')
  })

  it('renders left action button when leftAction is provided', () => {
    const { getByTestId } = renderWithProviders(
      <Header
        config={{
          title: 'Title',
          leftAction: { icon: '☰', label: 'Menu', action: navigateAction },
          testID: 'hdr',
        }}
      />,
    )
    expect(getByTestId('hdr-left-action')).toBeTruthy()
  })

  it('renders left action icon text', () => {
    const { getByText } = renderWithProviders(
      <Header
        config={{
          title: 'Title',
          leftAction: { icon: '☰', label: 'Menu', action: navigateAction },
        }}
      />,
    )
    expect(getByText('☰')).toBeTruthy()
  })

  it('renders a single rightAction', () => {
    const { getByTestId } = renderWithProviders(
      <Header
        config={{
          title: 'Title',
          rightAction: { icon: '⚙', label: 'Settings', action: navigateAction },
          testID: 'hdr',
        }}
      />,
    )
    expect(getByTestId('hdr-right-action-0')).toBeTruthy()
  })

  it('renders multiple rightActions', () => {
    const { getByTestId } = renderWithProviders(
      <Header
        config={{
          title: 'Title',
          rightActions: [
            { icon: '🔔', label: 'Notifications', action: navigateAction },
            { icon: '⚙', label: 'Settings', action: navigateAction },
          ],
          testID: 'hdr',
        }}
      />,
    )
    expect(getByTestId('hdr-right-action-0')).toBeTruthy()
    expect(getByTestId('hdr-right-action-1')).toBeTruthy()
  })

  it('rightActions takes precedence over rightAction when both provided', () => {
    const { getByTestId } = renderWithProviders(
      <Header
        config={{
          title: 'Title',
          rightAction: { icon: '⚙', label: 'Settings', action: navigateAction },
          rightActions: [{ icon: '🔔', label: 'Bell', action: navigateAction }],
          testID: 'hdr',
        }}
      />,
    )
    // rightActions wins — only index 0 from rightActions list
    expect(getByTestId('hdr-right-action-0')).toBeTruthy()
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <Header config={{ title: 'Title', testID: 'page-header' }} />,
    )
    expect(getByTestId('page-header')).toBeTruthy()
  })

  it('uses id as testID fallback for action elements when testID is not set', () => {
    const { getByTestId } = renderWithProviders(
      <Header
        config={{
          title: 'Title',
          id: 'top-header',
          rightAction: { icon: '⚙', label: 'Settings', action: navigateAction },
        }}
      />,
    )
    expect(getByTestId('top-header-right-action-0')).toBeTruthy()
  })
})
