import { useCallback, useState } from 'react'
import { useScreenContext } from '../context/ScreenContext'
import { useComponentData } from '../components/_base/useComponentData'
import type { DataListConfig } from '../components/data/data-list/types'

function getNestedValue(obj: unknown, path: string): unknown {
  if (typeof obj !== 'object' || obj === null) return undefined
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export interface UseDataListReturn<T> {
  data: T[] | null
  isLoading: boolean
  error: Error | null
  refreshing: boolean
  handleRefresh: () => Promise<void>
  handleItemPress: (item: T) => Promise<void>
  keyExtractor: (item: T, index: number) => string
}

/**
 * Headless hook for DataList behavior. Manages data fetching, refresh state,
 * item press dispatch, and key extraction. Use this when building a custom
 * list UI while retaining the config-driven data and action system.
 *
 * @example
 * const { data, isLoading, handleItemPress } = useDataList<Post>(config)
 */
export function useDataList<T = unknown>(config: DataListConfig): UseDataListReturn<T> {
  const { dispatch, setValue } = useScreenContext()
  const { data, isLoading, error } = useComponentData<T[]>(config.data)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!config.refreshable) return
    setRefreshing(true)
    await dispatch({ type: 'refresh' })
    setRefreshing(false)
  }, [config.refreshable, dispatch])

  const handleItemPress = useCallback(
    async (item: T) => {
      if (!config.onItemPress) return
      setValue('__pressedItem', item)
      await dispatch(config.onItemPress)
    },
    [config.onItemPress, dispatch, setValue],
  )

  const keyExtractor = useCallback(
    (item: T, index: number): string => {
      const key = getNestedValue(item, config.keyExtractor ?? 'id')
      return key !== undefined ? String(key) : String(index)
    },
    [config.keyExtractor],
  )

  return {
    data: data ?? null,
    isLoading,
    error,
    refreshing,
    handleRefresh,
    handleItemPress,
    keyExtractor,
  }
}
