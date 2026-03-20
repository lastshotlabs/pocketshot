import { useState, useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import type { TokenStorage } from '../auth/storage'

type RoomListener = (payload: unknown) => void

export class PocketshotWS {
  private ws: WebSocket | null = null
  private readonly endpointUrl: string
  private readonly storage: TokenStorage
  private subscribedRooms = new Set<string>()
  private listeners = new Map<string, Set<RoomListener>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null

  constructor(endpointUrl: string, storage: TokenStorage) {
    this.endpointUrl = endpointUrl.replace(/\/$/, '')
    this.storage = storage
  }

  async connect() {
    const token = await this.storage.getToken()
    const u = new URL(this.endpointUrl)
    if (token) u.searchParams.set('token', token)
    const url = u.toString()

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('[ws] connected')
      for (const room of this.subscribedRooms) {
        this.send({ action: 'subscribe', room })
      }
    }

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { room?: string }
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
      console.log('[ws] closed', e.code)
      if (e.code !== 1000) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      this.scheduleReconnect()
    }

    this.appStateSubscription?.remove()
    this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && (!this.ws || this.ws.readyState > WebSocket.OPEN)) {
        void this.connect()
      }
    })
  }

  subscribe(room: string, listener: RoomListener) {
    this.subscribedRooms.add(room)
    if (!this.listeners.has(room)) this.listeners.set(room, new Set())
    this.listeners.get(room)!.add(listener)
    this.send({ action: 'subscribe', room })
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
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect()
    }, 3000)
  }

  disconnect() {
    this.appStateSubscription?.remove()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close(1000)
    this.ws = null
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
