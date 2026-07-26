import type { ParsedDeepLink } from './types'

/**
 * Parses any URL string (scheme-based or HTTPS) into a structured ParsedDeepLink.
 * Never throws — returns a best-effort result for malformed URLs.
 *
 * @example
 * parseDeepLink('myapp://post/123?ref=email')
 * // { scheme: 'myapp', hostname: 'post', pathSegments: ['123'], queryParams: { ref: 'email' }, ... }
 *
 * parseDeepLink('https://example.com/post/123?ref=email')
 * // { scheme: 'https', hostname: 'example.com', pathSegments: ['post', '123'], queryParams: { ref: 'email' }, ... }
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  try {
    const parsed = new URL(url)
    const pathSegments = parsed.pathname.split('/').filter(Boolean)

    const queryParams: Record<string, string> = {}
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    return {
      url,
      scheme: parsed.protocol.replace(':', '') || null,
      hostname: parsed.hostname || null,
      pathSegments,
      queryParams,
    }
  } catch {
    // Fallback for non-standard URLs that URL() can't parse (e.g. myapp://screen)
    const schemeMatch = /^([a-z][a-z0-9+\-.]*):\/\/([^/?#]*)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i.exec(url)
    if (schemeMatch) {
      const [, scheme, hostname, path = '', search = ''] = schemeMatch
      const pathSegments = path.split('/').filter(Boolean)
      const queryParams: Record<string, string> = {}
      if (search) {
        search
          .replace(/^\?/, '')
          .split('&')
          .forEach((pair) => {
            const [k, v = ''] = pair.split('=').map(decodeURIComponent)
            if (k) queryParams[k] = v
          })
      }
      return { url, scheme: scheme ?? null, hostname: hostname ?? null, pathSegments, queryParams }
    }
    return { url, scheme: null, hostname: null, pathSegments: [], queryParams: {} }
  }
}

/**
 * Matches a parsed deep link against a route pattern and extracts named params.
 *
 * Pattern syntax:
 *   - `/post/:id` matches `/post/123` → `{ id: '123' }`
 *   - `/user/:userId/profile` matches `/user/abc/profile` → `{ userId: 'abc' }`
 *   - Literal segments must match exactly.
 *   - Returns null if the pattern doesn't match.
 *
 * @example
 * matchPattern('/post/:id', ['post', '123']) // { id: '123' }
 * matchPattern('/post/:id', ['comment', '123']) // null
 */
export function matchPattern(
  pattern: string,
  pathSegments: string[],
): Record<string, string> | null {
  const patternSegments = pattern.split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternSegments.length; i++) {
    const pSeg = patternSegments[i]!
    const uSeg = pathSegments[i]!
    if (pSeg.startsWith(':')) {
      try {
        params[pSeg.slice(1)] = decodeURIComponent(uSeg)
      } catch {
        return null
      }
    } else if (pSeg !== uSeg) {
      return null
    }
  }
  return params
}
