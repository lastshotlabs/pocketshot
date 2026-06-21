import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { DataTableBase, type DataTableSortDirection } from './standalone'
import type { DataTableConfig } from './types'

export function DataTable({ config }: { config: DataTableConfig }) {
  const { dispatch, setValue, values } = useScreenContext()
  const { data, isLoading, error } = useComponentData<Record<string, unknown>[]>(config.data)

  const resolvedSortKey: string | undefined = useMemo(() => {
    if (isFromRef(config.sortKey)) {
      const resolved = resolveFromRef(config.sortKey, values) as unknown
      return typeof resolved === 'string' ? resolved : undefined
    }
    return typeof config.sortKey === 'string' ? config.sortKey : undefined
  }, [config.sortKey, values])

  const resolvedSortDir: DataTableSortDirection | undefined = useMemo(() => {
    if (isFromRef(config.sortDirection)) {
      const resolved = resolveFromRef(config.sortDirection, values) as unknown
      return resolved === 'asc' || resolved === 'desc' ? resolved : undefined
    }
    return config.sortDirection === 'asc' || config.sortDirection === 'desc'
      ? (config.sortDirection as DataTableSortDirection)
      : undefined
  }, [config.sortDirection, values])

  const handleSortChange = useCallback(
    (key: string, direction: DataTableSortDirection) => {
      if (config.id) {
        setValue(`${config.id}_sortKey`, key)
        setValue(`${config.id}_sortDir`, direction)
      }
    },
    [config.id, setValue],
  )

  const handleRowPress = useCallback(
    async (row: Record<string, unknown>) => {
      if (!config.onRowPress) return
      setValue('__pressedRow', row)
      await dispatch(config.onRowPress)
    },
    [config.onRowPress, dispatch, setValue],
  )

  const rows = Array.isArray(data) ? data : []

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <DataTableBase
        rows={rows}
        columns={config.columns}
        defaultSortKey={resolvedSortKey}
        defaultSortDirection={resolvedSortDir ?? 'asc'}
        sortKey={resolvedSortKey}
        sortDirection={resolvedSortDir}
        onSortChange={handleSortChange}
        onRowPress={config.onRowPress ? (row) => void handleRowPress(row) : undefined}
        stickyHeader={config.stickyHeader}
        loading={isLoading && !data}
        loadingCount={config.loadingCount ?? 5}
        error={Boolean(error)}
        emptyMessage={config.emptyMessage ?? 'No data'}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
