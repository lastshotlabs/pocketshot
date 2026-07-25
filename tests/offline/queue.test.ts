import { describe, it, expect, vi, beforeEach } from 'vitest'

// expo-sqlite is not installed in test env — OfflineQueue uses in-memory fallback
vi.mock('expo-sqlite', () => {
  throw new Error('not installed')
})

import { OfflineQueue, createMemoryOfflineQueueStorage } from '../../src/offline/queue'
import type { QueuedOperation } from '../../src/offline/types'

describe('OfflineQueue (in-memory fallback)', () => {
  let queue: OfflineQueue

  beforeEach(() => {
    // Suppress the console.warn about in-memory fallback
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    queue = new OfflineQueue()
  })

  it('warns about in-memory mode when expo-sqlite is absent', () => {
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('in-memory only'))
  })

  it('starts empty', async () => {
    const ops = await queue.getAll()
    expect(ops).toHaveLength(0)
  })

  it('enqueues an operation', async () => {
    const op = await queue.enqueue({ method: 'POST', path: '/api/posts', body: { title: 'Hello' } })
    expect(op.id).toBeDefined()
    expect(op.method).toBe('POST')
    expect(op.path).toBe('/api/posts')
    expect(op.attempts).toBe(0)
    expect(op.schemaVersion).toBe(2)
    expect(op.idempotencyKey).toBe(op.id)
    expect(op.status).toBe('queued')
    expect(op.queuedAt).toBeDefined()
  })

  it('assigns unique IDs to each operation', async () => {
    const op1 = await queue.enqueue({ method: 'POST', path: '/a', body: {} })
    const op2 = await queue.enqueue({ method: 'POST', path: '/b', body: {} })
    expect(op1.id).not.toBe(op2.id)
  })

  it('deduplicates commands with the same caller idempotency key', async () => {
    const first = await queue.enqueue({
      method: 'POST',
      path: '/charge',
      body: { amount: 10 },
      idempotencyKey: 'charge-1',
    })
    const duplicate = await queue.enqueue({
      method: 'POST',
      path: '/charge',
      body: { amount: 10 },
      idempotencyKey: 'charge-1',
    })
    expect(duplicate.id).toBe(first.id)
    expect(await queue.getAll()).toHaveLength(1)
  })

  it('serializes concurrent enqueues without dropping commands', async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        queue.enqueue({ method: 'POST', path: `/commands/${index}`, body: { index } }),
      ),
    )
    const operations = await queue.getAll()
    expect(operations).toHaveLength(20)
    expect(new Set(operations.map((operation) => operation.id)).size).toBe(20)
  })

  it('getAll returns all queued operations in order', async () => {
    await queue.enqueue({ method: 'POST', path: '/first', body: {} })
    await queue.enqueue({ method: 'PATCH', path: '/second', body: {} })
    const ops = await queue.getAll()
    expect(ops).toHaveLength(2)
    expect(ops[0]!.path).toBe('/first')
    expect(ops[1]!.path).toBe('/second')
  })

  it('dequeue removes the operation by id', async () => {
    const op = await queue.enqueue({ method: 'DELETE', path: '/item/1', body: {} })
    await queue.dequeue(op.id)
    const ops = await queue.getAll()
    expect(ops).toHaveLength(0)
  })

  it('dequeue is a no-op for unknown id', async () => {
    await queue.enqueue({ method: 'POST', path: '/item', body: {} })
    await queue.dequeue('nonexistent-id')
    const ops = await queue.getAll()
    expect(ops).toHaveLength(1)
  })

  it('incrementAttempts increases the attempt count', async () => {
    const op = await queue.enqueue({ method: 'POST', path: '/retry', body: {} })
    await queue.incrementAttempts(op.id)
    await queue.incrementAttempts(op.id)
    const ops = await queue.getAll()
    expect(ops[0]!.attempts).toBe(2)
  })

  it('clear empties the queue', async () => {
    await queue.enqueue({ method: 'POST', path: '/a', body: {} })
    await queue.enqueue({ method: 'POST', path: '/b', body: {} })
    await queue.clear()
    const ops = await queue.getAll()
    expect(ops).toHaveLength(0)
  })

  it('supports all write HTTP methods', async () => {
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'] as const
    for (const method of methods) {
      await queue.enqueue({ method, path: `/test`, body: null })
    }
    const ops = await queue.getAll()
    expect(ops).toHaveLength(4)
  })

  it('respects maxAttempts config option', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const q = new OfflineQueue({ maxAttempts: 3, retryDelay: 500 })
    // maxAttempts is stored internally — verify it doesn't throw on construction
    expect(q).toBeDefined()
  })

  it('recovers an interrupted processing command after process restart', async () => {
    const interrupted: QueuedOperation = {
      schemaVersion: 2,
      id: 'operation-1',
      idempotencyKey: 'operation-1',
      method: 'POST',
      path: '/resume',
      body: {},
      queuedAt: '2026-07-25T00:00:00.000Z',
      attempts: 0,
      status: 'processing',
      nextAttemptAt: null,
      lastError: null,
    }
    const storage = createMemoryOfflineQueueStorage([interrupted])
    const restarted = new OfflineQueue({ storage })

    const recovered = await restarted.getAll()
    expect(recovered[0]?.status).toBe('queued')
    expect(recovered[0]?.lastError).toContain('process interruption')
  })

  it('persists retry scheduling and explicit dead-letter recovery', async () => {
    let now = new Date('2026-07-25T00:00:00.000Z')
    const storage = createMemoryOfflineQueueStorage()
    const durable = new OfflineQueue({ storage, now: () => now, retryDelay: 1_000 })
    const operation = await durable.enqueue({ method: 'POST', path: '/retry', body: {} })

    await durable.markRetry(operation.id, 'offline')
    expect(await durable.getReady()).toHaveLength(0)
    now = new Date('2026-07-25T00:00:01.000Z')
    expect(await durable.getReady()).toHaveLength(1)

    await durable.moveToDeadLetter(operation.id, 'invalid')
    expect(await durable.getAll()).toHaveLength(0)
    expect(await durable.getDeadLetters()).toHaveLength(1)
    await durable.retryDeadLetter(operation.id)
    expect(await durable.getReady()).toHaveLength(1)
  })
})
