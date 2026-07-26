import { matchPattern, parseDeepLink } from './parse'
import type {
  DeepLinkControllerOptions,
  DeepLinkDelivery,
  DeepLinkDeliverySource,
  DeepLinkRouteDefinition,
  ParsedDeepLink,
} from './types'

const DEFAULT_MAX_PENDING = 20
const DEFAULT_MAX_SEEN = 200

export class DeepLinkController {
  private ready = false
  private pending: Array<{ url: string; source: DeepLinkDeliverySource }> = []
  private readonly seen = new Set<string>()
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly options: DeepLinkControllerOptions) {
    if (options.allowedSchemes.length === 0 || options.routes.length === 0) {
      throw new Error('[pocketshot] Deep-link schemes and routes are required')
    }
    for (const route of options.routes) validateRoute(route)
  }

  setReady(ready = true): Promise<void> {
    this.ready = ready
    if (!ready) return Promise.resolve()
    const pending = this.pending.splice(0)
    return this.serialize(async () => {
      for (const item of pending) await this.deliver(item.url, item.source)
    })
  }

  ingest(url: string, source: DeepLinkDeliverySource): Promise<DeepLinkDelivery> {
    if (!this.ready) {
      if (this.pending.length >= (this.options.maxPending ?? DEFAULT_MAX_PENDING)) {
        this.pending.shift()
      }
      this.pending.push({ url, source })
      return Promise.resolve({ status: 'queued', source })
    }
    let result!: DeepLinkDelivery
    return this.serialize(async () => {
      result = await this.deliver(url, source)
    }).then(() => result)
  }

  clear(): void {
    this.pending = []
    this.seen.clear()
  }

  get pendingCount(): number {
    return this.pending.length
  }

  private async deliver(url: string, source: DeepLinkDeliverySource): Promise<DeepLinkDelivery> {
    const parsed = this.normalize(url)
    if (!parsed) return { status: 'rejected', source, reason: 'origin' }
    const fingerprint = this.fingerprint(url)
    if (this.seen.has(fingerprint)) return { status: 'duplicate', source }

    for (const route of this.options.routes) {
      const params = matchPattern(route.pattern, parsed.pathSegments)
      if (params === null) continue
      const query = filterQuery(parsed.queryParams, route.allowedQueryParams)
      if (!query) return { status: 'rejected', source, reason: 'query' }
      this.remember(fingerprint)
      await route.handler({ ...params, ...query }, parsed, source)
      return { status: 'handled', source, routeId: route.id }
    }
    return { status: 'unmatched', source }
  }

  private normalize(value: string): ParsedDeepLink | null {
    if (!value || value.length > (this.options.maxUrlLength ?? 4_096)) return null
    let url: URL
    try {
      url = new URL(value)
    } catch {
      return null
    }
    if (url.username || url.password) return null
    const scheme = url.protocol.slice(0, -1).toLowerCase()
    const customScheme = this.options.allowedSchemes
      .map((item) => item.toLowerCase())
      .includes(scheme)
    const universalLink =
      scheme === 'https' &&
      (this.options.allowedHttpsHosts ?? [])
        .map((item) => item.toLowerCase())
        .includes(url.hostname.toLowerCase())
    if (!customScheme && !universalLink) return null
    const parsed = parseDeepLink(value)
    if (customScheme && parsed.hostname) {
      parsed.pathSegments = [parsed.hostname, ...parsed.pathSegments]
    }
    return parsed
  }

  private fingerprint(url: string): string {
    if (this.options.fingerprint) return this.options.fingerprint(url)
    // Non-cryptographic and process-local: avoids retaining OAuth codes/routes in memory.
    let hash = 2166136261
    for (let index = 0; index < url.length; index += 1) {
      hash ^= url.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(36)
  }

  private remember(fingerprint: string): void {
    this.seen.add(fingerprint)
    while (this.seen.size > (this.options.maxSeen ?? DEFAULT_MAX_SEEN)) {
      const oldest = this.seen.values().next().value as string | undefined
      if (oldest === undefined) break
      this.seen.delete(oldest)
    }
  }

  private serialize(operation: () => Promise<void>): Promise<void> {
    const run = this.queue.then(operation)
    this.queue = run.catch(() => undefined)
    return run
  }
}

function validateRoute(route: DeepLinkRouteDefinition): void {
  if (!route.id.trim() || !route.pattern.startsWith('/') || typeof route.handler !== 'function') {
    throw new Error('[pocketshot] Deep-link route definition is invalid')
  }
  const query = route.allowedQueryParams ?? []
  if (new Set(query).size !== query.length || query.some((key) => !key.trim())) {
    throw new Error('[pocketshot] Deep-link query allowlist is invalid')
  }
}

function filterQuery(
  query: Record<string, string>,
  allowed: readonly string[] | undefined,
): Record<string, string> | null {
  const keys = Object.keys(query)
  if (!allowed) return keys.length === 0 ? {} : null
  if (keys.some((key) => !allowed.includes(key))) return null
  return Object.fromEntries(keys.map((key) => [key, query[key]!]))
}
