export interface CursorListParams {
  limit?: number
  cursor?: string
  sortDir?: 'asc' | 'desc'
}

export function appendListParams(
  search: URLSearchParams,
  params?: CursorListParams,
): URLSearchParams {
  if (params?.limit !== undefined) search.set('limit', String(params.limit))
  if (params?.cursor !== undefined) search.set('cursor', params.cursor)
  if (params?.sortDir !== undefined) search.set('sortDir', params.sortDir)
  return search
}

export function listQuery(params?: CursorListParams): string {
  const search = appendListParams(new URLSearchParams(), params)
  const query = search.toString()
  return query ? `?${query}` : ''
}
