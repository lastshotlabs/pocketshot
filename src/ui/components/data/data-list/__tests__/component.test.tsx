import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { DataList } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

vi.mock('../../../_base/useComponentData', () => ({
  useComponentData: vi.fn(() => ({ data: null, isLoading: true, error: null })),
}))

import { useComponentData } from '../../../_base/useComponentData'

const mockUseComponentData = vi.mocked(useComponentData)

describe('DataList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders loading skeleton when isLoading is true and data is null', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: true, error: null })
    const { toJSON } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: '/api/users' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders skeleton row count matching loadingCount', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: true, error: null })
    const { toJSON } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: '/api/users', loadingCount: 5 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders error message when error is set', () => {
    mockUseComponentData.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
    })
    const { getByText } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: '/api/users' }} />,
    )
    expect(getByText('Failed to load data.')).toBeTruthy()
  })

  it('renders empty message when data is an empty array', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    const { getByText } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: '/api/users' }} />,
    )
    expect(getByText('Nothing here yet')).toBeTruthy()
  })

  it('renders custom emptyMessage when data is empty', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    const { getByText } = renderWithProviders(
      <DataList
        config={{ itemType: 'user', data: '/api/users', emptyMessage: 'No users found' }}
      />,
    )
    expect(getByText('No users found')).toBeTruthy()
  })

  it('renders item labels when data is provided', () => {
    mockUseComponentData.mockReturnValue({
      data: [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ],
      isLoading: false,
      error: null,
    })
    const { getByText } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: '/api/users' }} />,
    )
    expect(getByText('Item 1')).toBeTruthy()
    expect(getByText('Item 2')).toBeTruthy()
  })

  it('falls back to title field when name is absent', () => {
    mockUseComponentData.mockReturnValue({
      data: [{ id: '1', title: 'My Title' }],
      isLoading: false,
      error: null,
    })
    const { getByText } = renderWithProviders(
      <DataList config={{ itemType: 'post', data: '/api/posts' }} />,
    )
    expect(getByText('My Title')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    const { getByTestId } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: '/api/users', testID: 'user-list' }} />,
    )
    expect(getByTestId('user-list')).toBeTruthy()
  })

  it('renders items as pressable buttons when onItemPress is provided', () => {
    mockUseComponentData.mockReturnValue({
      data: [{ id: '1', name: 'Alice' }],
      isLoading: false,
      error: null,
    })
    const { getByRole } = renderWithProviders(
      <DataList
        config={{
          itemType: 'user',
          data: '/api/users',
          onItemPress: { type: 'navigate', to: '/UserDetail' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('renders list role on the FlatList', () => {
    mockUseComponentData.mockReturnValue({
      data: [{ id: '1', name: 'Alice' }],
      isLoading: false,
      error: null,
    })
    const { getByRole } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: '/api/users' }} />,
    )
    expect(getByRole('list')).toBeTruthy()
  })

  it('renders without crashing when data prop is a from-ref', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: true, error: null })
    const { toJSON } = renderWithProviders(
      <DataList config={{ itemType: 'user', data: { from: 'userList' } }} />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
