import { useQuery } from '@tanstack/react-query'
import type { FromRef } from '@lastshotlabs/frontend-contract/refs'
import type { EndpointTarget, ResourceRef } from '@lastshotlabs/frontend-contract/resources'
import { useAppContext } from '../../context/AppContext'
import { useScreenContext } from '../../context/ScreenContext'
import {
  createManifestResourceQueryKey,
  resolveManifestResourceTarget,
} from '../../manifest/resources'
import { resolveRuntimeValue } from '../../runtime/resolve'
import { resolveFromRef, isFromRef } from './fromRef'

type DataSpec =
  | string
  | FromRef
  | ResourceRef
  | { url: string; method?: 'GET' | 'POST'; body?: unknown }
  | {
      endpoint: EndpointTarget
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      params?: Record<string, unknown>
      body?: unknown
    }

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
  const { api, manifest } = useAppContext()
  const { values } = useScreenContext()

  // from-ref: read from screen context synchronously, no fetch
  const fromRefResult = isFromRef(spec) ? (resolveFromRef(spec, values) as T | null) : undefined
  const isRef = isFromRef(spec)

  // Parse the spec outside of conditional paths so hooks are called unconditionally
  let method = 'GET'
  let path = ''
  let resourceName: string | undefined
  let resourceParams: Record<string, unknown> | undefined
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
    } else if (
      spec !== null &&
      spec !== undefined &&
      typeof spec === 'object' &&
      'resource' in spec
    ) {
      const target = resolveRuntimeValue(spec, { values }) as ResourceRef
      const resolved = resolveManifestResourceTarget(target, manifest.resources)
      method = resolved.request.method
      path = resolved.url
      resourceName = resolved.resourceName
      resourceParams = resolved.request.params
      enabled = true
    } else if (spec !== null && spec !== undefined && typeof spec === 'object' && 'url' in spec) {
      method = spec.method?.toUpperCase() ?? 'GET'
      path = spec.url
      body = resolveRuntimeValue(spec.body, { values })
      enabled = !!path
    } else if (
      spec !== null &&
      spec !== undefined &&
      typeof spec === 'object' &&
      'endpoint' in spec
    ) {
      const target = resolveRuntimeValue(spec.endpoint, { values }) as EndpointTarget
      const params = spec.params
        ? (resolveRuntimeValue(spec.params, { values }) as Record<string, unknown>)
        : undefined
      const resolved = resolveManifestResourceTarget(
        target,
        manifest.resources,
        params,
        spec.method?.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | undefined,
      )
      method = resolved.request.method
      path = resolved.url
      resourceName = resolved.resourceName
      resourceParams = resolved.request.params
      body = resolveRuntimeValue(spec.body, { values })
      enabled = !!path
    }
  }

  const queryKey = resourceName
    ? createManifestResourceQueryKey(resourceName, resourceParams)
    : ['componentData', method, path, body !== undefined ? JSON.stringify(body) : null]

  const result = useQuery<T | null>({
    queryKey,
    queryFn: async () => {
      switch (method) {
        case 'POST':
          return api.post<T>(path, body ?? {})
        case 'PUT':
          return api.put<T>(path, body ?? {})
        case 'PATCH':
          return api.patch<T>(path, body ?? {})
        case 'DELETE':
          return api.delete<T>(path, body)
        default:
          return api.get<T>(path)
      }
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
