import { useEffect, useRef } from 'react'
import type { AppStateManager } from '../app-state/manager'
import type { TokenStorage } from '../auth/storage'
import { SseManager } from './manager'

// ── Factory ───────────────────────────────────────────────────────────────────

interface CreateSseHooksOpts {
  tokenStorage: TokenStorage
  appStateManager: AppStateManager
}

/**
 * Creates the SSE hook factory bound to the SDK instance.
 * Maintains a Map of SseManager instances keyed by URL — one manager per endpoint.
 */
export function createSseHooks(opts: CreateSseHooksOpts) {
  const managers = new Map<string, SseManager>()

  function getOrCreateManager(url: string): SseManager {
    if (!managers.has(url)) {
      const manager = new SseManager({
        url,
        tokenStorage: opts.tokenStorage,
        appStateManager: opts.appStateManager,
      })
      managers.set(url, manager)
      void manager.connect()
    }
    return managers.get(url)!
  }

  /**
   * Subscribe to all events from an SSE endpoint.
   * The connection is shared — multiple hooks using the same URL share one connection.
   *
   * @param url - Full SSE endpoint URL
   * @param onEvent - Called for every event received (parsed JSON or raw string)
   * @param eventType - Event type to listen for (default: 'message')
   *
   * @example
   * useSse('https://api.example.com/stream', (data) => console.log(data))
   * useSse('https://api.example.com/stream', onNotif, 'notification')
   */
  function useSse(
    url: string,
    onEvent: (data: unknown, eventType: string) => void,
    eventType = 'message',
  ): void {
    const onEventRef = useRef(onEvent)
    onEventRef.current = onEvent

    useEffect(() => {
      const manager = getOrCreateManager(url)
      const unsub = manager.on(eventType, (data, type) => onEventRef.current(data, type))
      return unsub
    }, [url, eventType])
  }

  /**
   * Subscribe to typed SSE events with automatic JSON parsing.
   * Narrows the data type via a type parameter.
   *
   * @example
   * useSseEvent<{ userId: string; message: string }>(
   *   'https://api.example.com/stream',
   *   'chat',
   *   (msg) => console.log(msg.message)
   * )
   */
  function useSseEvent<T>(url: string, eventType: string, onEvent: (data: T) => void): void {
    const onEventRef = useRef(onEvent)
    onEventRef.current = onEvent

    useEffect(() => {
      const manager = getOrCreateManager(url)
      const unsub = manager.on(eventType, (data) => onEventRef.current(data as T))
      return unsub
    }, [url, eventType])
  }

  /**
   * Destroys all SSE managers — call this on SDK teardown.
   * Typically not needed in normal usage (managers persist for the app lifetime).
   */
  function destroyAllSse(): void {
    for (const manager of managers.values()) manager.destroy()
    managers.clear()
  }

  return { useSse, useSseEvent, destroyAllSse }
}

export type SseHooks = ReturnType<typeof createSseHooks>
