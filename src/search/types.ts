/** A single search result item. Generic over the result data shape. */
export interface SearchResult<T = Record<string, unknown>> {
  id: string
  type: string
  score?: number
  data: T
  highlight?: Record<string, string[]>
}

/** Parameters for a search request. */
export interface SearchParams {
  query: string
  types?: string[]
  filters?: Record<string, unknown>
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
}

/** Paginated search response. */
export interface SearchResponse<T = Record<string, unknown>> {
  results: SearchResult<T>[]
  total: number
  took?: number
  limit: number
  offset: number
}

/** Options for useSearch. */
export interface UseSearchOptions {
  /** Minimum query length before searching. Default: 2. */
  minLength?: number
  /** Debounce delay in ms. Default: 300. */
  debounce?: number
  /** API endpoint. Default: '/search'. */
  endpoint?: string
  /** Whether to include empty query in results. Default: false. */
  searchEmpty?: boolean
  /** staleTime override. Default: 60_000. */
  staleTime?: number
}
