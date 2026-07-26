import { describe, expect, it, vi } from 'vitest'
import { SseManager } from '../../src/sse'
import { PocketshotWS } from '../../src/ws'
import type { AppStateManager } from '../../src/app-state'
import type { TokenStorage } from '../../src/auth'

function appState(): AppStateManager {
  return {
    onForeground: () => () => undefined,
    onBackground: () => () => undefined,
  } as unknown as AppStateManager
}

function storage(token = 'private-token'): TokenStorage {
  return {
    getToken: vi.fn(async () => token),
  } as unknown as TokenStorage
}

describe('legacy realtime transport security', () => {
  it('rejects insecure or credential-bearing endpoints', () => {
    expect(() => new SseManager({ url: 'http://api.test/events', tokenStorage: storage(), appStateManager: appState() })).toThrow(
      'HTTPS',
    )
    expect(() => new PocketshotWS('ws://api.test/ws', storage(), appState())).toThrow('WSS')
    expect(() => new PocketshotWS('wss://user:pass@api.test/ws', storage(), appState())).toThrow(
      'credentials',
    )
  })

  it('authenticates websocket connections in a frame instead of a URL', async () => {
    const sent: string[] = []
    class MockWebSocket {
      static OPEN = 1
      readyState = 0
      onopen: (() => void) | null = null
      onmessage: ((event: { data: string }) => void) | null = null
      onclose: ((event: { code: number }) => void) | null = null
      onerror: (() => void) | null = null
      constructor(readonly url: string) {
        expect(url).toBe('wss://api.test/ws')
      }
      send(value: string) {
        sent.push(value)
      }
      close() {}
    }
    vi.stubGlobal('WebSocket', MockWebSocket)
    const tokenStorage = storage()
    const ws = new PocketshotWS('wss://api.test/ws', tokenStorage, appState())
    const listener = vi.fn()
    ws.subscribe('party:one', listener)
    await vi.waitFor(() => expect(tokenStorage.getToken).toHaveBeenCalledOnce())
    const socket = (ws as unknown as { ws: MockWebSocket }).ws
    socket.readyState = MockWebSocket.OPEN
    socket.onopen?.()
    expect(sent.map((value) => JSON.parse(value))).toEqual([
      { action: 'authenticate', token: 'private-token' },
      { action: 'subscribe', room: 'party:one' },
    ])
    ws.disconnect()
    vi.unstubAllGlobals()
  })
})
