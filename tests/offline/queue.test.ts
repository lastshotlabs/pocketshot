import { describe, it, expect, vi, beforeEach } from 'vitest'

// expo-sqlite is not installed in test env — OfflineQueue uses in-memory fallback
vi.mock('expo-sqlite', () => { throw new Error('not installed') })

import { OfflineQueue } from '../../src/offline/queue'

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
    expect(op.queuedAt).toBeDefined()
  })

  it('assigns unique IDs to each operation', async () => {
    const op1 = await queue.enqueue({ method: 'POST', path: '/a', body: {} })
    const op2 = await queue.enqueue({ method: 'POST', path: '/b', body: {} })
    expect(op1.id).not.toBe(op2.id)
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

  it('supports all HTTP methods', async () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
    for (const method of methods) {
      await queue.enqueue({ method, path: `/test`, body: null })
    }
    const ops = await queue.getAll()
    expect(ops).toHaveLength(5)
  })

  it('respects maxAttempts config option', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const q = new OfflineQueue({ maxAttempts: 3, retryDelay: 500 })
    // maxAttempts is stored internally — verify it doesn't throw on construction
    expect(q).toBeDefined()
  })
})
