import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { RealtimeChannel } from '../../src/realtime/channel'
import { MemoryRealtimeStorage } from '../../src/realtime/memory-storage'
import type { RealtimeEvent, RealtimeSnapshot, RealtimeSocket } from '../../src/realtime/types'

type State = { values: string[] }

class FakeSocket implements RealtimeSocket {
  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: ((event?: unknown) => void) | null = null
  onclose: ((event: { code: number; reason?: string }) => void) | null = null

  send(data: string): void {
    this.sent.push(data)
  }

  close(code = 1000, reason?: string): void {
    this.readyState = 3
    this.onclose?.({ code, reason })
  }

  open(): void {
    this.readyState = 1
    this.onopen?.()
  }

  message(value: unknown): void {
    this.onmessage?.({ data: JSON.stringify(value) })
  }

  serverClose(code = 1006): void {
    this.readyState = 3
    this.onclose?.({ code })
  }
}

function event(cursor: number): RealtimeEvent<string> {
  return {
    version: 1,
    channel: 'room:1',
    id: `event-${cursor}`,
    cursor,
    type: 'added',
    timestamp: '2026-07-25T00:00:00.000Z',
    payload: String(cursor),
  }
}

async function settle(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('RealtimeChannel', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function setup(
    snapshots: Array<RealtimeSnapshot<State>> = [
      { version: 1, channel: 'room:1', cursor: 0, state: { values: [] } },
    ],
  ) {
    const sockets: FakeSocket[] = []
    const socketUrls: string[] = []
    const fetchSnapshot = vi.fn(async () => {
      const snapshot = snapshots.shift()
      if (!snapshot) throw new Error('No snapshot configured')
      return snapshot
    })
    const refreshAuth = vi.fn(async () => undefined)
    const storage = new MemoryRealtimeStorage()
    const channel = new RealtimeChannel<string, State>({
      channel: 'room:1',
      url: 'wss://api.example.test/realtime',
      schemas: { payload: z.string(), state: z.object({ values: z.array(z.string()) }) },
      getToken: async () => 'access-token',
      refreshAuth,
      fetchSnapshot,
      reduce: (state, next) => ({ values: [...state.values, next.payload] }),
      storage,
      socketFactory: (url) => {
        socketUrls.push(url)
        const socket = new FakeSocket()
        sockets.push(socket)
        return socket
      },
      reconnectJitter: 0,
      heartbeatIntervalMs: 100,
      heartbeatTimeoutMs: 50,
    })
    return { channel, sockets, socketUrls, fetchSnapshot, refreshAuth, storage }
  }

  it('resumes with token and cursor, rejects invalid frames, and persists applied cursors', async () => {
    const { channel, sockets, socketUrls, storage } = setup()
    await channel.start()
    sockets[0].open()

    expect(socketUrls[0]).not.toContain('access-token')
    expect(sockets[0].sent[0]).toContain('"type":"authenticate"')
    expect(sockets[0].sent[0]).toContain('"token":"access-token"')
    expect(sockets[0].sent[1]).toContain('"type":"subscribe"')
    sockets[0].message({ ...event(1), payload: 99 })
    sockets[0].message(event(1))
    await settle()

    expect(channel.state).toEqual({ values: ['1'] })
    expect(channel.diagnostics.rejectedEvents).toBe(1)
    expect(await storage.loadCursor('room:1')).toBe(1)
    channel.stop()
  })

  it('recovers a cursor gap with a snapshot and drains the buffered event once', async () => {
    const { channel, sockets, fetchSnapshot } = setup([
      { version: 1, channel: 'room:1', cursor: 0, state: { values: [] } },
      { version: 1, channel: 'room:1', cursor: 1, state: { values: ['server-1'] } },
    ])
    await channel.start()
    sockets[0].open()
    sockets[0].message(event(2))
    await settle()

    expect(fetchSnapshot).toHaveBeenLastCalledWith(0)
    expect(channel.state).toEqual({ values: ['server-1', '2'] })
    expect(channel.diagnostics.gapRecoveries).toBe(1)
    expect(channel.diagnostics.lastCursor).toBe(2)
    channel.stop()
  })

  it('pauses in background and reconciles before reconnecting on resume', async () => {
    const { channel, sockets, fetchSnapshot } = setup([
      { version: 1, channel: 'room:1', cursor: 0, state: { values: [] } },
      {
        version: 1,
        channel: 'room:1',
        cursor: 4,
        state: { values: ['while-backgrounded'] },
      },
    ])
    await channel.start()
    sockets[0].open()
    channel.pause()

    expect(channel.diagnostics.state).toBe('paused')
    expect(sockets[0].readyState).toBe(3)

    await channel.resume()
    expect(fetchSnapshot).toHaveBeenLastCalledWith(0)
    expect(channel.state).toEqual({ values: ['while-backgrounded'] })
    expect(sockets).toHaveLength(2)
    channel.stop()
  })

  it('refreshes expired auth and reconnects with exponential backoff', async () => {
    const { channel, sockets, refreshAuth } = setup()
    await channel.start()
    sockets[0].open()
    sockets[0].message({ type: 'auth_expired' })
    await settle()

    expect(refreshAuth).toHaveBeenCalledOnce()
    expect(channel.diagnostics.state).toBe('backing_off')
    expect(channel.diagnostics.reconnectAttempt).toBe(1)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(sockets).toHaveLength(2)
    sockets[1].serverClose()
    expect(channel.diagnostics.reconnectAttempt).toBe(2)
    await vi.advanceTimersByTimeAsync(1_999)
    expect(sockets).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(sockets).toHaveLength(3)
    channel.stop()
  })

  it('detects a missing heartbeat response and reconnects', async () => {
    const { channel, sockets } = setup()
    await channel.start()
    sockets[0].open()

    await vi.advanceTimersByTimeAsync(100)
    expect(sockets[0].sent.at(-1)).toContain('"type":"ping"')
    await vi.advanceTimersByTimeAsync(50)
    expect(channel.diagnostics.lastError).toBe('Heartbeat timeout')
    expect(channel.diagnostics.state).toBe('backing_off')
    channel.stop()
  })

  it('suppresses duplicate event ids and cursors', async () => {
    const { channel, sockets } = setup()
    await channel.start()
    sockets[0].open()
    sockets[0].message(event(1))
    sockets[0].message(event(1))
    await settle()

    expect(channel.state).toEqual({ values: ['1'] })
    expect(channel.diagnostics.duplicateEvents).toBe(1)
    channel.stop()
  })

  it('rejects unsupported event protocol versions', async () => {
    const { channel, sockets } = setup()
    await channel.start()
    sockets[0].open()
    sockets[0].message({ ...event(1), version: 2 })
    await settle()

    expect(channel.state).toEqual({ values: [] })
    expect(channel.diagnostics.rejectedEvents).toBe(1)
    channel.stop()
  })
})
