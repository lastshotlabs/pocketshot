import { useEffect, useRef } from 'react'
import { parseDeepLink, matchPattern } from './parse'
import type { DeepLinkRoute, DeepLinkRouterOptions, ParsedDeepLink } from './types'

// ── Optional peer dep ─────────────────────────────────────────────────────────

function requireExpoLinking() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-linking') as {
      getInitialURL(): Promise<string | null>
      addEventListener(type: 'url', listener: (e: { url: string }) => void): { remove(): void }
      createURL(path: string, opts?: { queryParams?: Record<string, string> }): string
    }
  } catch {
    throw new Error(
      '[pocketshot] Deep links require expo-linking.\nInstall it: npx expo install expo-linking',
    )
  }
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

/**
 * Subscribes to incoming deep links while the app is running.
 * The callback receives a fully parsed `ParsedDeepLink`.
 *
 * @param onLink - Called for every incoming link (stable-ref'd internally).
 *
 * @example
 * useDeepLink((link) => {
 *   console.log(link.pathSegments) // ['post', '123']
 *   console.log(link.queryParams)  // { ref: 'email' }
 * })
 */
export function useDeepLink(onLink: (link: ParsedDeepLink) => void): void {
  const onLinkRef = useRef(onLink)
  onLinkRef.current = onLink

  useEffect(() => {
    let Linking: ReturnType<typeof requireExpoLinking>
    try {
      Linking = requireExpoLinking()
    } catch (e) {
      console.warn((e as Error).message)
      return
    }

    const sub = Linking.addEventListener('url', (e) => {
      onLinkRef.current(parseDeepLink(e.url))
    })
    return () => sub.remove()
  }, [])
}

/**
 * Matches incoming deep links against a set of route patterns and calls
 * the matching handler with extracted path params.
 *
 * Also handles the initial URL that launched the app (opt-out via `handleInitialUrl: false`).
 *
 * @example
 * useDeepLinkRouter([
 *   {
 *     pattern: '/post/:id',
 *     handler: ({ id }) => router.push(`/posts/${id}`),
 *   },
 *   {
 *     pattern: '/invite/:code',
 *     handler: ({ code }) => handleInvite(code),
 *   },
 * ])
 */
export function useDeepLinkRouter(routes: DeepLinkRoute[], opts: DeepLinkRouterOptions = {}): void {
  const { handleInitialUrl = true } = opts
  const routesRef = useRef(routes)
  routesRef.current = routes

  function dispatch(url: string): void {
    const parsed = parseDeepLink(url)
    for (const route of routesRef.current) {
      const params = matchPattern(route.pattern, parsed.pathSegments)
      if (params !== null) {
        route.handler({ ...params, ...parsed.queryParams }, parsed)
        return
      }
    }
  }

  useEffect(() => {
    let Linking: ReturnType<typeof requireExpoLinking>
    try {
      Linking = requireExpoLinking()
    } catch (e) {
      console.warn((e as Error).message)
      return
    }

    // Handle initial URL (app opened via deep link)
    if (handleInitialUrl) {
      void Linking.getInitialURL().then((url) => {
        if (url) dispatch(url)
      })
    }

    const sub = Linking.addEventListener('url', (e) => dispatch(e.url))
    return () => sub.remove()
  }, [handleInitialUrl])
}

/**
 * Creates a deep link URL using the app's registered scheme.
 * Thin wrapper around `expo-linking`'s `createURL`.
 *
 * @example
 * const url = createDeepLinkUrl('/post/123', { ref: 'share' })
 * // → 'myapp://post/123?ref=share'
 */
export function createDeepLinkUrl(path: string, queryParams?: Record<string, string>): string {
  const Linking = requireExpoLinking()
  return Linking.createURL(path, queryParams ? { queryParams } : undefined)
}
