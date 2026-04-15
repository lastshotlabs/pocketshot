import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { StatusBadge } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('StatusBadge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<StatusBadge config={{ status: 'active' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the resolved label for a known default status', () => {
    const { getByText } = renderWithProviders(<StatusBadge config={{ status: 'active' }} />)
    expect(getByText('Active')).toBeTruthy()
  })

  it('renders all built-in statuses without crashing', () => {
    const statuses = [
      'active',
      'enabled',
      'live',
      'pending',
      'processing',
      'loading',
      'error',
      'failed',
      'rejected',
      'inactive',
      'disabled',
      'archived',
      'draft',
      'scheduled',
    ] as const
    for (const status of statuses) {
      const { toJSON } = renderWithProviders(<StatusBadge config={{ status }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders pending label correctly', () => {
    const { getByText } = renderWithProviders(<StatusBadge config={{ status: 'pending' }} />)
    expect(getByText('Pending')).toBeTruthy()
  })

  it('renders completed label via custom statusMap', () => {
    const { getByText } = renderWithProviders(
      <StatusBadge
        config={{
          status: 'completed',
          statusMap: { completed: { label: 'Completed', color: 'success' } },
        }}
      />,
    )
    expect(getByText('Completed')).toBeTruthy()
  })

  it('falls back to capitalised status string for unknown status', () => {
    const { getByText } = renderWithProviders(<StatusBadge config={{ status: 'unknown_state' }} />)
    expect(getByText('Unknown_state')).toBeTruthy()
  })

  it('renders sm size without crashing', () => {
    const { toJSON } = renderWithProviders(
      <StatusBadge config={{ status: 'active', size: 'sm' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders md size without crashing', () => {
    const { toJSON } = renderWithProviders(
      <StatusBadge config={{ status: 'active', size: 'md' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders without dot when showDot is false', () => {
    const { toJSON } = renderWithProviders(
      <StatusBadge config={{ status: 'active', showDot: false }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <StatusBadge config={{ status: 'active', testID: 'order-status' }} />,
    )
    expect(getByTestId('order-status')).toBeTruthy()
  })

  it('resolves status from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <StatusBadge config={{ status: { from: 'orderState' } }} />,
      { initialValues: { orderState: 'pending' } },
    )
    expect(getByText('Pending')).toBeTruthy()
  })

  it('resolves custom status from context via from-ref with statusMap', () => {
    const { getByText } = renderWithProviders(
      <StatusBadge
        config={{
          status: { from: 'currentStatus' },
          statusMap: { shipped: { label: 'Shipped', color: 'info' } },
        }}
      />,
      { initialValues: { currentStatus: 'shipped' } },
    )
    expect(getByText('Shipped')).toBeTruthy()
  })

  it('accepts shared text styling props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <StatusBadge config={{ status: 'active', color: 'primary', fontSize: 'lg' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('accepts slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <StatusBadge
        config={{
          status: 'active',
          slots: {
            label: { letterSpacing: 'wide' },
            dot: { opacity: 0.8 },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
