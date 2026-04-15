import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Timeline } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const BASIC_ITEMS = [
  { id: 'evt1', title: 'Order placed' },
  { id: 'evt2', title: 'Payment confirmed' },
  { id: 'evt3', title: 'Shipped' },
]

describe('Timeline', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Timeline config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders without crashing with empty items array', () => {
    const { toJSON } = renderWithProviders(<Timeline config={{ items: [] }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders item titles', () => {
    const { getByText } = renderWithProviders(<Timeline config={{ items: BASIC_ITEMS }} />)
    expect(getByText('Order placed')).toBeTruthy()
    expect(getByText('Payment confirmed')).toBeTruthy()
    expect(getByText('Shipped')).toBeTruthy()
  })

  it('renders item descriptions when provided', () => {
    const itemsWithDesc = [
      { id: 'e1', title: 'Started', description: 'Workflow began' },
      { id: 'e2', title: 'Ended', description: 'Workflow complete' },
    ]
    const { getByText } = renderWithProviders(<Timeline config={{ items: itemsWithDesc }} />)
    expect(getByText('Workflow began')).toBeTruthy()
    expect(getByText('Workflow complete')).toBeTruthy()
  })

  it('renders item timestamps when provided', () => {
    const itemsWithTime = [
      { id: 'e1', title: 'Created', timestamp: '2 hours ago' },
      { id: 'e2', title: 'Updated', timestamp: 'Just now' },
    ]
    const { getByText } = renderWithProviders(<Timeline config={{ items: itemsWithTime }} />)
    expect(getByText('2 hours ago')).toBeTruthy()
    expect(getByText('Just now')).toBeTruthy()
  })

  it('renders items with icons without crashing', () => {
    const itemsWithIcon = [{ id: 'e1', title: 'With icon', icon: '★' }]
    const { getByText } = renderWithProviders(<Timeline config={{ items: itemsWithIcon }} />)
    expect(getByText('With icon')).toBeTruthy()
  })

  it('renders items with custom color without crashing', () => {
    const itemsWithColor = [{ id: 'e1', title: 'Error event', color: '#ef4444' }]
    const { getByText } = renderWithProviders(<Timeline config={{ items: itemsWithColor }} />)
    expect(getByText('Error event')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Timeline config={{ items: BASIC_ITEMS, testID: 'order-timeline' }} />,
    )
    expect(getByTestId('order-timeline')).toBeTruthy()
  })

  it('renders a single item without crashing', () => {
    const { getByText } = renderWithProviders(
      <Timeline config={{ items: [{ id: 'solo', title: 'Solo event' }] }} />,
    )
    expect(getByText('Solo event')).toBeTruthy()
  })

  it('renders a full item with all optional fields', () => {
    const fullItem = {
      id: 'full',
      title: 'Full event',
      description: 'A detailed description',
      timestamp: 'Yesterday',
      icon: '✓',
      color: '#22c55e',
    }
    const { getByText } = renderWithProviders(<Timeline config={{ items: [fullItem] }} />)
    expect(getByText('Full event')).toBeTruthy()
    expect(getByText('A detailed description')).toBeTruthy()
    expect(getByText('Yesterday')).toBeTruthy()
  })

  it('accepts data as a string endpoint without crashing', () => {
    const { toJSON } = renderWithProviders(<Timeline config={{ data: '/api/events' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('accepts data as a from-ref without crashing', () => {
    const { toJSON } = renderWithProviders(<Timeline config={{ data: { from: 'eventFeed' } }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('accepts shared text styling props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Timeline config={{ items: BASIC_ITEMS, color: 'muted', fontSize: 'lg', textAlign: 'center' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
