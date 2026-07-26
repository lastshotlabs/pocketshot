/** A parsed deep link or universal link. */
export interface ParsedDeepLink {
  /** The full original URL string. */
  url: string
  /** URL scheme (e.g. 'myapp', 'https'). */
  scheme: string | null
  /** Hostname (e.g. 'example.com', 'screen'). */
  hostname: string | null
  /** URL path segments split by '/'. Empty segments removed. */
  pathSegments: string[]
  /** Query parameters as a key-value record. */
  queryParams: Record<string, string>
}

/** Configuration for a deep link route pattern. */
export interface DeepLinkRoute<TParams = Record<string, string>> {
  /** Pattern to match, e.g. '/post/:id' or '/user/:userId/profile'. */
  pattern: string
  /** Called when a URL matches this pattern. */
  handler: (params: TParams & Record<string, string>, parsed: ParsedDeepLink) => void
}

/** Options for useDeepLinkRouter. */
export interface DeepLinkRouterOptions {
  /** Whether to also handle the initial URL that opened the app. Default: true. */
  handleInitialUrl?: boolean
}

export type DeepLinkDeliverySource = 'cold' | 'warm' | 'push' | 'qr'

export interface DeepLinkRouteDefinition {
  id: string
  pattern: string
  allowedQueryParams?: readonly string[]
  handler(
    params: Record<string, string>,
    parsed: ParsedDeepLink,
    source: DeepLinkDeliverySource,
  ): void | Promise<void>
}

export interface DeepLinkControllerOptions {
  allowedSchemes: readonly string[]
  allowedHttpsHosts?: readonly string[]
  routes: readonly DeepLinkRouteDefinition[]
  maxPending?: number
  maxSeen?: number
  maxUrlLength?: number
  fingerprint?: (url: string) => string
}

export type DeepLinkDelivery =
  | { status: 'queued' | 'duplicate' | 'unmatched'; source: DeepLinkDeliverySource }
  | { status: 'handled'; source: DeepLinkDeliverySource; routeId: string }
  | { status: 'rejected'; source: DeepLinkDeliverySource; reason: 'origin' | 'query' }
