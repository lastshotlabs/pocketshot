import { useQuery } from '@tanstack/react-query'
import { useAppContext } from '../../context/AppContext'
import { useScreenContext } from '../../context/ScreenContext'
import { resolveFromRef, isFromRef } from './fromRef'

type DataSpec =
  | string
  | { from: string }
  | { url: string; method?: 'GET' | 'POST'; body?: unknown }

/**
 * Fetches data for a config-driven component.
 *
 * Accepts three data spec forms:
 *   - `"GET /api/posts"` — string shorthand (`METHOD path`)
 *   - `{ from: "componentId" }` — read from another component's published screen state value
 *   - `{ url: "/api/posts", method: "GET" }` — explicit object form
 *
 * When using the from-ref form, no network request is made — the value is read
 * synchronously from ScreenContext.
 *
 * @example
 * const { data, isLoading, error } = useComponentData<Post[]>('GET /api/posts')
 * const { data } = useComponentData<Post[]>({ from: 'searchResults' })
 */
export function useComponentData<T>(spec: DataSpec | undefined): {
  data: T | null
  isLoading: boolean
  error: Error | null
} {
  const { api } = useAppContext()
  const { values } = useScreenContext()

  // from-ref: read from screen context synchronously, no fetch
  const fromRefResult = isFromRef(spec)
    ? (resolveFromRef(spec, values) as T | null)
    : undefined
  const isRef = isFromRef(spec)

  // Parse the spec outside of conditional paths so hooks are called unconditionally
  let method = 'GET'
  let path = ''
  let body: unknown = undefined
  let enabled = false

  if (!isRef) {
    if (typeof spec === 'string') {
      const spaceIdx = spec.indexOf(' ')
      if (spaceIdx !== -1) {
        method = spec.slice(0, spaceIdx).toUpperCase()
        path = spec.slice(spaceIdx + 1)
      } else {
        path = spec
      }
      enabled = !!path
    } else if (spec !== null && spec !== undefined && typeof spec === 'object' && 'url' in spec) {
      method = (spec.method?.toUpperCase()) ?? 'GET'
      path = spec.url
      body = spec.body
      enabled = !!path
    }
  }

  const queryKey = ['componentData', method, path, body]

  const result = useQuery<T | null>({
    queryKey,
    queryFn: async () => {
      if (method === 'POST') return api.post<T>(path, body ?? {})
      return api.get<T>(path)
    },
    enabled: !isRef && enabled,
    staleTime: 60_000,
    retry: false,
  })

  if (isRef) {
    return { data: fromRefResult ?? null, isLoading: false, error: null }
  }

  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  }
}
