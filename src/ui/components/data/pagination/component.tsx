import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { isFromRef, resolveFromRef } from '../../_base'
import { PaginationBase, type PaginationMode } from './standalone'
import type { PaginationConfig } from './types'

export function Pagination({ config }: { config: PaginationConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedCurrentPage = useMemo(() => {
    if (isFromRef(config.currentPage)) {
      const resolved = resolveFromRef(config.currentPage, values)
      return typeof resolved === 'number' ? resolved : undefined
    }
    return typeof config.currentPage === 'number' ? config.currentPage : undefined
  }, [config.currentPage, values])

  const handlePageChange = useCallback(
    async (page: number) => {
      if (config.id) setValue(config.id, page)
      if (config.onPageChange) {
        await dispatch(config.onPageChange)
      }
    },
    [config.id, config.onPageChange, dispatch, setValue],
  )

  const handleLoadMore = useCallback(async () => {
    if (config.onLoadMore) {
      await dispatch(config.onLoadMore)
    }
  }, [config.onLoadMore, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PaginationBase
        mode={(config.mode ?? 'pages') as PaginationMode}
        currentPage={resolvedCurrentPage}
        totalPages={config.totalPages ?? 1}
        onPageChange={(p) => void handlePageChange(p)}
        onLoadMore={() => void handleLoadMore()}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
