import { describe, expect, it } from 'vitest'
import { DataTableSchema } from '../schema'

describe('DataTableSchema', () => {
  it('parses a minimal valid config', () => {
    const result = DataTableSchema.parse({
      data: 'GET /api/users',
      columns: [{ key: 'name', label: 'Name' }],
    })

    expect(result.columns).toHaveLength(1)
  })

  it('accepts from-ref sorting inputs', () => {
    const result = DataTableSchema.parse({
      data: { from: 'table.rows' },
      columns: [{ key: 'name', label: 'Name' }],
      sortKey: { from: 'table.sortKey' },
      sortDirection: { from: 'table.sortDir' },
    })

    expect(result.sortKey).toEqual({ from: 'table.sortKey' })
    expect(result.sortDirection).toEqual({ from: 'table.sortDir' })
  })

  it('accepts table slot surfaces', () => {
    const result = DataTableSchema.parse({
      data: 'GET /api/users',
      columns: [{ key: 'name', label: 'Name' }],
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
        emptyState: {
          paddingY: 'lg',
        },
      },
    })

    expect(result.slots?.headerRow).toMatchObject({ bg: 'card' })
    expect(result.slots?.cell).toMatchObject({ color: 'muted' })
  })
})
