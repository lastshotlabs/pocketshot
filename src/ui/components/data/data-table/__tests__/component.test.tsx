import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { DataTable } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

vi.mock('../../../_base/useComponentData', () => ({
  useComponentData: vi.fn(() => ({ data: null, isLoading: true, error: null })),
}))

import { useComponentData } from '../../../_base/useComponentData'

const mockUseComponentData = vi.mocked(useComponentData)

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
]

describe('DataTable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders loading state without crashing', () => {
    mockUseComponentData.mockReturnValue({ data: null, isLoading: true, error: null })
    const { toJSON } = renderWithProviders(
      <DataTable config={{ data: '/api/users', columns: COLUMNS }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders empty message when no rows exist', () => {
    mockUseComponentData.mockReturnValue({ data: [], isLoading: false, error: null })
    const { getByText } = renderWithProviders(
      <DataTable config={{ data: '/api/users', columns: COLUMNS, emptyMessage: 'No users' }} />,
    )
    expect(getByText('No users')).toBeTruthy()
  })

  it('renders header labels and row values', () => {
    mockUseComponentData.mockReturnValue({
      data: [{ id: '1', name: 'Alice', email: 'a@example.com' }],
      isLoading: false,
      error: null,
    })
    const { getByText, toJSON } = renderWithProviders(
      <DataTable config={{ data: '/api/users', columns: COLUMNS, testID: 'users-table' }} />,
    )

    expect(toJSON()).toBeTruthy()
    expect(getByText('Alice')).toBeTruthy()
    expect(getByText('a@example.com')).toBeTruthy()
  })

  it('renders row buttons when onRowPress is provided', () => {
    mockUseComponentData.mockReturnValue({
      data: [{ id: '1', name: 'Alice', email: 'a@example.com' }],
      isLoading: false,
      error: null,
    })
    const { getByRole } = renderWithProviders(
      <DataTable
        config={{
          data: '/api/users',
          columns: COLUMNS,
          onRowPress: { type: 'navigate', to: '/detail' },
        }}
      />,
    )

    expect(getByRole('button')).toBeTruthy()
  })

  it('renders with table slot surfaces without crashing', () => {
    mockUseComponentData.mockReturnValue({
      data: [{ id: '1', name: 'Alice', email: 'a@example.com' }],
      isLoading: false,
      error: null,
    })
    const { toJSON } = renderWithProviders(
      <DataTable
        config={{
          data: '/api/users',
          columns: COLUMNS,
          slots: {
            headerRow: {
              bg: 'card',
            },
            headerCell: {
              paddingY: 'sm',
            },
            row: {
              paddingY: 'sm',
            },
            cell: {
              color: 'muted',
            },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('accepts from-ref sort state without crashing', () => {
    mockUseComponentData.mockReturnValue({
      data: [{ id: '1', name: 'Alice', email: 'a@example.com' }],
      isLoading: false,
      error: null,
    })
    const { toJSON } = renderWithProviders(
      <DataTable
        config={{
          data: '/api/users',
          columns: COLUMNS,
          sortKey: { from: 'table.sortKey' },
          sortDirection: { from: 'table.sortDir' },
        }}
      />,
      { initialValues: { table: { sortKey: 'name', sortDir: 'asc' } } },
    )
    expect(toJSON()).toBeTruthy()
  })
})
