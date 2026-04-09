import { useCallback, useEffect, useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import type { SearchParams, SearchResponse, SearchResult, UseSearchOptions } from './types'

export function createSearchHooks(api: ApiClient) {
  /**
   * Debounced search hook. Fires a query to the search endpoint after the user
   * stops typing for `debounce` ms. Returns typed results.
   *
   * @example
   * const { query, setQuery, results, isLoading } = useSearch<PostResult>({
   *   endpoint: '/search',
   *   debounce: 300,
   *   minLength: 2,
   * })
   */
  function useSearch<T = Record<string, unknown>>(
    params: Partial<SearchParams> = {},
    opts: UseSearchOptions = {},
  ) {
    const {
      minLength = 2,
      debounce = 300,
      endpoint = '/search',
      searchEmpty = false,
      staleTime = 60_000,
    } = opts

    const [query, setQuery] = useState(params.query ?? '')
    const [debouncedQuery, setDebouncedQuery] = useState(query)

    useEffect(() => {
      const timer = setTimeout(() => setDebouncedQuery(query), debounce)
      return () => clearTimeout(timer)
    }, [query, debounce])

    const isEnabled = searchEmpty ? debouncedQuery.length >= 0 : debouncedQuery.length >= minLength

    const searchParams: SearchParams = {
      ...params,
      query: debouncedQuery,
    }

    const { data, isLoading, isFetching, error } = useQuery<SearchResponse<T>>({
      queryKey: ['search', endpoint, searchParams],
      queryFn: () => api.post<SearchResponse<T>>(endpoint, searchParams),
      enabled: isEnabled,
      staleTime,
      retry: false,
    })

    const clearSearch = useCallback(() => {
      setQuery('')
      setDebouncedQuery('')
    }, [])

    return {
      query,
      setQuery,
      results: data?.results ?? [],
      total: data?.total ?? 0,
      took: data?.took,
      isLoading: isLoading && isEnabled,
      isFetching,
      error,
      clearSearch,
      hasResults: (data?.results.length ?? 0) > 0,
      isEmpty: isEnabled && !isLoading && (data?.results.length ?? 0) === 0,
    }
  }

  /**
   * Infinite scroll search. Fetches pages as the user scrolls.
   * Pass `loadMore()` to your FlatList's `onEndReached`.
   *
   * @example
   * const { results, loadMore, hasNextPage, isLoading } = useInfiniteSearch({
   *   query: searchQuery,
   *   types: ['thread'],
   * })
   */
  function useInfiniteSearch<T = Record<string, unknown>>(
    params: SearchParams,
    opts: Omit<UseSearchOptions, 'debounce'> = {},
  ) {
    const { minLength = 2, endpoint = '/search', staleTime = 60_000 } = opts

    const pageSize = params.limit ?? 20
    const isEnabled = params.query.length >= minLength

    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery<
      SearchResponse<T>
    >({
      queryKey: ['search', 'infinite', endpoint, params],
      queryFn: ({ pageParam = 0 }) =>
        api.post<SearchResponse<T>>(endpoint, {
          ...params,
          offset: pageParam as number,
          limit: pageSize,
        }),
      getNextPageParam: (lastPage, allPages) => {
        const fetched = allPages.reduce((sum, p) => sum + p.results.length, 0)
        return fetched < lastPage.total ? fetched : undefined
      },
      initialPageParam: 0,
      enabled: isEnabled,
      staleTime,
    })

    const results: SearchResult<T>[] = data?.pages.flatMap((p) => p.results) ?? []
    const total = data?.pages[0]?.total ?? 0

    return {
      results,
      total,
      isLoading: isLoading && isEnabled,
      isFetching,
      hasNextPage: hasNextPage ?? false,
      loadMore: fetchNextPage,
      hasResults: results.length > 0,
      isEmpty: isEnabled && !isLoading && results.length === 0,
    }
  }

  return { useSearch, useInfiniteSearch }
}

export type SearchHooks = ReturnType<typeof createSearchHooks>
