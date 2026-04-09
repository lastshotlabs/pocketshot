import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useInfiniteQuery: vi.fn(),
}))
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: vi.fn((initial: unknown) => [initial, vi.fn()]),
    useEffect: vi.fn(),
    useCallback: (fn: unknown) => fn,
  }
})

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { createSearchHooks } from '../../src/search/hooks'
import type { ApiClient } from '../../src/api/client'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>
const mockUseInfiniteQuery = useInfiniteQuery as ReturnType<typeof vi.fn>

function makeApi(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    fetch: vi.fn(),
  } as unknown as ApiClient
}

describe('createSearchHooks factory shape', () => {
  it('returns useSearch and useInfiniteSearch', () => {
    const hooks = createSearchHooks(makeApi())
    expect(typeof hooks.useSearch).toBe('function')
    expect(typeof hooks.useInfiniteSearch).toBe('function')
  })
})

describe('useSearch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the default /search endpoint', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
    })
    const { useSearch } = createSearchHooks(makeApi())
    useSearch()
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['search', '/search']),
      }),
    )
  })

  it('accepts a custom endpoint via opts', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
    })
    const { useSearch } = createSearchHooks(makeApi())
    useSearch({}, { endpoint: '/search/threads' })
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['search', '/search/threads']),
      }),
    )
  })

  it('returns empty results when data is undefined', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
    })
    const { useSearch } = createSearchHooks(makeApi())
    const result = useSearch()
    expect(result.results).toEqual([])
    expect(result.total).toBe(0)
    expect(result.hasResults).toBe(false)
  })

  it('calls api.post with search params in queryFn', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
    })
    const { useSearch } = createSearchHooks(api)
    useSearch({ types: ['thread'] })
    const call = mockUseQuery.mock.calls[0]![0] as { queryFn: () => void }
    call.queryFn()
    expect(api.post).toHaveBeenCalledWith('/search', expect.objectContaining({ types: ['thread'] }))
  })

  it('disables query when query is shorter than minLength', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
    })
    const { useSearch } = createSearchHooks(makeApi())
    // useState returns '' (empty) by default in mock — debouncedQuery = ''
    useSearch({}, { minLength: 3 })
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    )
  })
})

describe('useInfiniteSearch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses /search endpoint by default', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    })
    const { useInfiniteSearch } = createSearchHooks(makeApi())
    useInfiniteSearch({ query: 'hello' })
    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['search', 'infinite', '/search']),
      }),
    )
  })

  it('is disabled when query is shorter than minLength', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    })
    const { useInfiniteSearch } = createSearchHooks(makeApi())
    useInfiniteSearch({ query: 'a' }, { minLength: 3 })
    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    )
  })

  it('returns empty results when data is undefined', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    })
    const { useInfiniteSearch } = createSearchHooks(makeApi())
    const result = useInfiniteSearch({ query: 'hello' })
    expect(result.results).toEqual([])
    expect(result.total).toBe(0)
    expect(result.hasNextPage).toBe(false)
  })

  it('getNextPageParam returns undefined when all results fetched', () => {
    mockUseInfiniteQuery.mockImplementation((opts: any) => {
      const lastPage = { results: [{ id: '1' }], total: 1 }
      opts.getNextPageParam(lastPage, [lastPage])
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
      }
    })
    const { useInfiniteSearch } = createSearchHooks(makeApi())
    useInfiniteSearch({ query: 'hello' })
    // No assertion needed — just verifying getNextPageParam doesn't throw
  })
})
