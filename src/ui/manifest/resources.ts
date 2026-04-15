import {
  buildRequestUrl,
  getResourceInvalidationTargets,
  resolveEndpointTarget,
  type EndpointTarget,
  type HttpMethod,
  type ResourceMap,
} from '@lastshotlabs/frontend-contract/resources'

export const MANIFEST_RESOURCE_QUERY_KEY_PREFIX = 'manifest-resource'

export interface QueryClientLike {
  invalidateQueries: (filters?: {
    queryKey?: readonly unknown[]
    predicate?: (query: { queryKey: readonly unknown[] }) => boolean
  }) => Promise<unknown> | unknown
}

export function createManifestResourceQueryKey(
  resourceName: string,
  params?: Record<string, unknown>,
): readonly [string, string, Record<string, unknown>] {
  return [MANIFEST_RESOURCE_QUERY_KEY_PREFIX, resourceName, normalizeResourceParams(params)]
}

export function resolveManifestResourceTarget(
  target: EndpointTarget,
  resources?: ResourceMap,
  params?: Record<string, unknown>,
  fallbackMethod: HttpMethod = 'GET',
): {
  request: ReturnType<typeof resolveEndpointTarget>
  url: string
  resourceName?: string
} {
  const request = resolveEndpointTarget(target, resources, params, fallbackMethod)
  return {
    request,
    url: buildRequestUrl(request.endpoint, request.params),
    resourceName: typeof target === 'string' ? undefined : target.resource,
  }
}

export async function invalidateManifestRefreshTarget(
  queryClient: QueryClientLike,
  target: string,
  resources?: ResourceMap,
): Promise<void> {
  const normalizedTargets = target
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  for (const nextTarget of normalizedTargets) {
    if (!nextTarget.startsWith('resource:')) {
      continue
    }

    await invalidateManifestResource(queryClient, nextTarget.slice('resource:'.length), resources)
  }
}

export async function invalidateManifestResource(
  queryClient: QueryClientLike,
  resourceName: string,
  resources?: ResourceMap,
): Promise<void> {
  const targets = [resourceName, ...getResourceInvalidationTargets(resourceName, resources)]

  for (const target of targets) {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === MANIFEST_RESOURCE_QUERY_KEY_PREFIX &&
        query.queryKey[1] === target,
    })
  }
}

function normalizeResourceParams(params?: Record<string, unknown>): Record<string, unknown> {
  if (!params) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(params).sort(([left], [right]) => left.localeCompare(right)),
  )
}
