import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ActivityFeed } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'
import type { ActivityFeedItem, ActivityFeedConfig } from '../types'

vi.mock('../../../_base/useComponentData', () => ({
  useComponentData: vi.fn(() => ({ data: null, isLoading: true, error: null })),
}))

// Import after mock so we can reconfigure per test
import { useComponentData } from '../../../_base/useComponentData'

const mockUseComponentData = useComponentData as ReturnType<typeof vi.fn>

/** Minimal valid config — supplies required fields that have defaults */
const base: ActivityFeedConfig = { emptyMessage: 'No activity yet', itemHeight: 72 }

describe('ActivityFeed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: true, error: null })
    const { toJSON } = renderWithProviders(<ActivityFeed config={base} />)
    expect(toJSON()).toBeTruthy()
  })

  it('shows loading state while data is loading', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: true, error: null })
    // ActivityIndicator is rendered — tree should be non-null
    const { toJSON } = renderWithProviders(<ActivityFeed config={base} />)
    expect(toJSON()).toBeTruthy()
  })

  it('shows error message when fetch fails', () => {
    mockUseComponentData.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
    })
    const { getByText } = renderWithProviders(<ActivityFeed config={base} />)
    expect(getByText('Failed to load activity')).toBeTruthy()
  })

  it('shows default empty message when data is empty array', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    const { getByText } = renderWithProviders(<ActivityFeed config={base} />)
    expect(getByText('No activity yet')).toBeTruthy()
  })

  it('shows custom emptyMessage when data is empty', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    const { getByText } = renderWithProviders(
      <ActivityFeed config={{ emptyMessage: 'Nothing here yet', itemHeight: 72 }} />,
    )
    expect(getByText('Nothing here yet')).toBeTruthy()
  })

  it('renders feed items with actor names', () => {
    const items: ActivityFeedItem[] = [
      { id: '1', actorName: 'Alice', action: 'commented on', target: 'your post' },
      { id: '2', actorName: 'Bob', action: 'liked', target: 'your photo' },
    ]
    mockUseComponentData.mockReturnValue({ data: items, isLoading: false, error: null })
    const { getByText } = renderWithProviders(<ActivityFeed config={base} />)
    expect(getByText('Alice')).toBeTruthy()
    expect(getByText('Bob')).toBeTruthy()
  })

  it('renders item action text', () => {
    const items: ActivityFeedItem[] = [
      { id: '1', actorName: 'Alice', action: 'commented on', target: 'your post' },
    ]
    mockUseComponentData.mockReturnValue({ data: items, isLoading: false, error: null })
    const { getByText } = renderWithProviders(<ActivityFeed config={base} />)
    expect(getByText(' commented on')).toBeTruthy()
  })

  it('renders item target text', () => {
    const items: ActivityFeedItem[] = [
      { id: '1', actorName: 'Alice', action: 'commented on', target: 'your post' },
    ]
    mockUseComponentData.mockReturnValue({ data: items, isLoading: false, error: null })
    const { getByText } = renderWithProviders(<ActivityFeed config={base} />)
    expect(getByText(' your post')).toBeTruthy()
  })

  it('renders item timestamp when present', () => {
    const items: ActivityFeedItem[] = [{ id: '1', actorName: 'Alice', timestamp: '2 hours ago' }]
    mockUseComponentData.mockReturnValue({ data: items, isLoading: false, error: null })
    const { getByText } = renderWithProviders(<ActivityFeed config={base} />)
    expect(getByText('2 hours ago')).toBeTruthy()
  })

  it('renders fallback actor name when actorName is missing', () => {
    const items: ActivityFeedItem[] = [{ id: '1', action: 'did something' }]
    mockUseComponentData.mockReturnValue({ data: items, isLoading: false, error: null })
    const { getByText } = renderWithProviders(<ActivityFeed config={base} />)
    expect(getByText('Someone')).toBeTruthy()
  })

  it('applies testID when provided in loading state', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: true, error: null })
    const { getByTestId } = renderWithProviders(
      <ActivityFeed config={{ ...base, testID: 'feed-loading' }} />,
    )
    expect(getByTestId('feed-loading')).toBeTruthy()
  })

  it('applies testID when provided in error state', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: false, error: new Error('fail') })
    const { getByTestId } = renderWithProviders(
      <ActivityFeed config={{ ...base, testID: 'feed-error' }} />,
    )
    expect(getByTestId('feed-error')).toBeTruthy()
  })

  it('applies testID when provided in empty state', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    const { getByTestId } = renderWithProviders(
      <ActivityFeed config={{ ...base, testID: 'feed-empty' }} />,
    )
    expect(getByTestId('feed-empty')).toBeTruthy()
  })

  it('passes data endpoint string to useComponentData', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    renderWithProviders(<ActivityFeed config={{ ...base, data: 'GET /api/activity' }} />)
    expect(mockUseComponentData).toHaveBeenCalledWith('GET /api/activity')
  })

  it('passes from-ref data config to useComponentData', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    renderWithProviders(<ActivityFeed config={{ ...base, data: { from: 'activityItems' } }} />)
    expect(mockUseComponentData).toHaveBeenCalledWith({ from: 'activityItems' })
  })

  it('renders multiple items without crashing', () => {
    const items: ActivityFeedItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      actorName: `User ${i}`,
      action: 'posted',
    }))
    mockUseComponentData.mockReturnValue({ data: items, isLoading: false, error: null })
    const { toJSON } = renderWithProviders(<ActivityFeed config={base} />)
    expect(toJSON()).toBeTruthy()
  })
})
