import { useState, useEffect } from 'react'
import type { TokenStorage } from '../auth/storage'
import type { AppStateManager } from '../app-state/manager'

type RoomListener = (payload: unknown) => void

export class PocketshotWS {
  private ws: WebSocket | null = null
  private readonly endpointUrl: string
  private readonly storage: TokenStorage
  private subscribedRooms = new Set<string>()
  private listeners = new Map<string, Set<RoomListener>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private unsubscribeForeground: (() => void) | null = null
  private unsubscribeBackground: (() => void) | null = null
  private connecting = false
  private stopped = false
  private reconnectDelay = 1_000

  /**
   * @param endpointUrl     - Full WebSocket URL, e.g. wss://api.example.com/ws
   * @param storage         - Token storage for auth header injection
   * @param appStateManager - Shared AppStateManager; WS reconnects on foreground
   */
  constructor(
    endpointUrl: string,
    storage: TokenStorage,
    appStateManager: AppStateManager,
    private readonly limits = { rooms: 100, payloadBytes: 256 * 1024, maxReconnectMs: 30_000 },
  ) {
    const endpoint = new URL(endpointUrl)
    if (endpoint.protocol !== 'wss:' || endpoint.username || endpoint.password) {
      throw new Error('[pocketshot] WebSocket endpoint must use WSS without credentials')
    }
    for (const value of Object.values(limits)) {
      if (!Number.isFinite(value) || value < 1) throw new Error('[pocketshot] WS limits are invalid')
    }
    this.endpointUrl = endpoint.toString().replace(/\/$/, '')
    this.storage = storage
    // Subscribe to foreground events via the centralized manager (not AppState directly)
    this.unsubscribeForeground = appStateManager.onForeground(() => {
      if (!this.ws || this.ws.readyState > WebSocket.OPEN) {
        void this.connect()
      }
    })
    this.unsubscribeBackground = appStateManager.onBackground(() => {
      this.closeSocket(1000)
    })
  }

  async connect(): Promise<void> {
    if (this.stopped || this.connecting || this.ws?.readyState === WebSocket.OPEN) return
    this.connecting = true
    let token: string | null
    try {
      token = await this.storage.getToken()
    } catch {
      this.connecting = false
      this.scheduleReconnect()
      return
    }
    if (this.stopped) {
      this.connecting = false
      return
    }
    this.ws = new WebSocket(this.endpointUrl)

    this.ws.onopen = () => {
      this.connecting = false
      this.reconnectDelay = 1_000
      if (token) this.send({ action: 'authenticate', token })
      for (const room of this.subscribedRooms) {
        this.send({ action: 'subscribe', room })
      }
    }

    this.ws.onmessage = (e) => {
      if (
        typeof e.data !== 'string' ||
        new TextEncoder().encode(e.data).byteLength > this.limits.payloadBytes
      ) {
        return
      }
      try {
        const msg = JSON.parse(e.data) as { room?: string }
        if (msg.room) {
          const roomListeners = this.listeners.get(msg.room)
          if (roomListeners) {
            for (const listener of roomListeners) listener(msg)
          }
        }
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = (e) => {
      this.connecting = false
      this.ws = null
      if (!this.stopped && e.code !== 1000) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      this.connecting = false
      this.scheduleReconnect()
    }
  }

  subscribe(room: string, listener: RoomListener) {
    if (!room.trim() || room.length > 200) throw new Error('[pocketshot] WS room is invalid')
    if (!this.subscribedRooms.has(room) && this.subscribedRooms.size >= this.limits.rooms) {
      throw new Error('[pocketshot] WS room capacity exceeded')
    }
    this.subscribedRooms.add(room)
    if (!this.listeners.has(room)) this.listeners.set(room, new Set())
    this.listeners.get(room)!.add(listener)

    if (!this.ws || this.ws.readyState > WebSocket.OPEN) {
      // No open connection — initiate one. onopen will send subscribe frames
      // for all rooms in subscribedRooms, so we don't double-send here.
      if (!this.connecting) {
        void this.connect()
      }
    } else {
      this.send({ action: 'subscribe', room })
    }
  }

  unsubscribe(room: string, listener?: RoomListener) {
    if (listener) {
      this.listeners.get(room)?.delete(listener)
    } else {
      this.listeners.delete(room)
    }
    if (!this.listeners.get(room)?.size) {
      this.subscribedRooms.delete(room)
      this.send({ action: 'unsubscribe', room })
    }
  }

  private send(payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.stopped || this.subscribedRooms.size === 0) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect()
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.limits.maxReconnectMs)
  }

  disconnect() {
    this.stopped = true
    this.unsubscribeForeground?.()
    this.unsubscribeForeground = null
    this.unsubscribeBackground?.()
    this.unsubscribeBackground = null
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.closeSocket(1000)
    this.listeners.clear()
    this.subscribedRooms.clear()
  }

  private closeSocket(code: number): void {
    const socket = this.ws
    this.ws = null
    if (socket) {
      socket.onclose = null
      socket.onerror = null
      socket.onmessage = null
      socket.onopen = null
      socket.close(code)
    }
  }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function createWsHooks(ws: PocketshotWS) {
  function useRoom(room: string): unknown {
    const [latest, setLatest] = useState<unknown>(null)

    useEffect(() => {
      const listener: RoomListener = (payload) => setLatest(payload)
      ws.subscribe(room, listener)
      return () => ws.unsubscribe(room, listener)
    }, [room])

    return latest
  }

  function useRoomEvent<T>(room: string, event: string, handler: (payload: T) => void): void {
    useEffect(() => {
      const listener: RoomListener = (payload) => {
        const msg = payload as { event?: string; payload?: T }
        if (msg.event === event) {
          handler(msg.payload as T)
        }
      }
      ws.subscribe(room, listener)
      return () => ws.unsubscribe(room, listener)
    }, [room, event, handler])
  }

  return { useRoom, useRoomEvent }
}

// ── notConfigured helper ──────────────────────────────────────────────────────

export function notConfigured(): never {
  throw new Error('WebSocket not configured. Pass wsEndpoint to createPocketshot().')
}
