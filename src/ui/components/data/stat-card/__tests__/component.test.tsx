import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { StatCard } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('StatCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <StatCard config={{ label: 'Revenue', value: '1,200' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the label text', () => {
    const { getByText } = renderWithProviders(
      <StatCard config={{ label: 'Active Users', value: '42' }} />,
    )
    expect(getByText('Active Users')).toBeTruthy()
  })

  it('renders string value', () => {
    const { getByText } = renderWithProviders(
      <StatCard config={{ label: 'Revenue', value: '$9,999' }} />,
    )
    expect(getByText('$9,999')).toBeTruthy()
  })

  it('renders numeric value as string', () => {
    const { getByText } = renderWithProviders(<StatCard config={{ label: 'Count', value: 42 }} />)
    expect(getByText('42')).toBeTruthy()
  })

  it('renders icon text when provided', () => {
    const { getByText } = renderWithProviders(
      <StatCard config={{ label: 'Revenue', value: '1,200', icon: '💰' }} />,
    )
    expect(getByText('💰')).toBeTruthy()
  })

  it('does not render icon when omitted', () => {
    const { toJSON } = renderWithProviders(
      <StatCard config={{ label: 'Revenue', value: '1,200' }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('💰')
  })

  it('renders upward trend indicator', () => {
    const { getByText } = renderWithProviders(
      <StatCard
        config={{
          label: 'Sales',
          value: '100',
          trend: { direction: 'up', value: '+12%' },
        }}
      />,
    )
    expect(getByText('↑ +12%')).toBeTruthy()
  })

  it('renders downward trend indicator', () => {
    const { getByText } = renderWithProviders(
      <StatCard
        config={{
          label: 'Churn',
          value: '5',
          trend: { direction: 'down', value: '-3%' },
        }}
      />,
    )
    expect(getByText('↓ -3%')).toBeTruthy()
  })

  it('renders neutral trend indicator', () => {
    const { getByText } = renderWithProviders(
      <StatCard
        config={{
          label: 'Retention',
          value: '80%',
          trend: { direction: 'neutral', value: '0%' },
        }}
      />,
    )
    expect(getByText('→ 0%')).toBeTruthy()
  })

  it('does not render trend row when trend is omitted', () => {
    const { toJSON } = renderWithProviders(
      <StatCard config={{ label: 'Revenue', value: '1,200' }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('↑')
    expect(json).not.toContain('↓')
    expect(json).not.toContain('→')
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <StatCard config={{ label: 'Revenue', value: '1,200', testID: 'stat-revenue' }} />,
    )
    expect(getByTestId('stat-revenue')).toBeTruthy()
  })

  it('renders a pressable button when onPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <StatCard
        config={{
          label: 'Revenue',
          value: '1,200',
          onPress: { type: 'navigate', path: '/RevenueDetail' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('does not render a button when onPress is absent', () => {
    const { toJSON } = renderWithProviders(
      <StatCard config={{ label: 'Revenue', value: '1,200' }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('"button"')
  })

  it('resolves value from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <StatCard config={{ label: 'Members', value: { from: 'memberCount' } }} />,
      { initialValues: { memberCount: '512' } },
    )
    expect(getByText('512')).toBeTruthy()
  })

  it('renders all elements together: icon + label + value + trend + action', () => {
    const { getByText, getByRole } = renderWithProviders(
      <StatCard
        config={{
          label: 'Revenue',
          value: '$10,000',
          icon: '💰',
          trend: { direction: 'up', value: '+5%' },
          onPress: { type: 'navigate', path: '/RevenueDetail' },
        }}
      />,
    )
    expect(getByText('💰')).toBeTruthy()
    expect(getByText('Revenue')).toBeTruthy()
    expect(getByText('$10,000')).toBeTruthy()
    expect(getByText('↑ +5%')).toBeTruthy()
    expect(getByRole('button')).toBeTruthy()
  })
})
