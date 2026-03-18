/**
 * WebSocket client for pocketshot.
 * Authenticates via ?token= query param (bunshot accepts this for mobile clients).
 * Handles reconnect on AppState resume and heartbeat close (1001).
 */
import { AppState, type AppStateStatus } from 'react-native'
import { WS_BASE_URL } from './config'
import { tokenStorage } from './tokenStorage'

type RoomListener = (payload: unknown) => void

export class PocketshotWS {
  private ws: WebSocket | null = null
  private subscribedRooms = new Set<string>()
  private listeners = new Map<string, Set<RoomListener>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null

  async connect() {
    const token = await tokenStorage.get()
    const url = token ? `${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}` : `${WS_BASE_URL}/ws`

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('[ws] connected')
      // Re-subscribe to all rooms after reconnect
      for (const room of this.subscribedRooms) {
        this.send({ action: 'subscribe', room })
      }
    }

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.room) {
          const roomListeners = this.listeners.get(msg.room)
          if (roomListeners) {
            for (const listener of roomListeners) listener(msg)
          }
        }
      } catch {}
    }

    this.ws.onclose = (e) => {
      console.log('[ws] closed', e.code)
      // 1001 = heartbeat timeout (normal reconnect), 1000 = clean close (don't reconnect)
      if (e.code !== 1000) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      this.scheduleReconnect()
    }

    // Reconnect when app returns to foreground
    this.appStateSubscription?.remove()
    this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && (!this.ws || this.ws.readyState > WebSocket.OPEN)) {
        this.connect()
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
      this.connect()
    }, 3000)
  }

  disconnect() {
    this.appStateSubscription?.remove()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close(1000)
    this.ws = null
  }
}

export const ws = new PocketshotWS()
