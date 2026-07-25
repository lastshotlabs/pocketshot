import { describe, expect, it, vi } from 'vitest'
import { ApiError, type ApiClient } from '../../src/api/client'
import { OfflineCommandProcessor } from '../../src/offline/processor'
import { OfflineQueue, createMemoryOfflineQueueStorage } from '../../src/offline/queue'

function api(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    post: vi.fn(async () => ({ ok: true })),
    put: vi.fn(async () => ({ ok: true })),
    patch: vi.fn(async () => ({ ok: true })),
    delete: vi.fn(async () => ({ ok: true })),
    ...overrides,
  } as unknown as ApiClient
}

describe('OfflineCommandProcessor', () => {
  it('replays FIFO commands with a stable idempotency header and removes acknowledgements', async () => {
    const queue = new OfflineQueue({
      storage: createMemoryOfflineQueueStorage(),
      createId: (() => {
        let id = 0
        return () => `command-${++id}`
      })(),
    })
    await queue.enqueue({ method: 'POST', path: '/first', body: { order: 1 } })
    await queue.enqueue({ method: 'PATCH', path: '/second', body: { order: 2 } })
    const client = api()

    const result = await new OfflineCommandProcessor(queue, client).flush()

    expect(result).toEqual({ flushed: 2, failed: 0, deadLettered: 0, deferred: 0 })
    expect(client.post).toHaveBeenCalledWith(
      '/first',
      { order: 1 },
      { headers: { 'Idempotency-Key': 'command-1' } },
    )
    expect(client.patch).toHaveBeenCalledWith(
      '/second',
      { order: 2 },
      { headers: { 'Idempotency-Key': 'command-2' } },
    )
    expect(await queue.getAll()).toHaveLength(0)
  })

  it('coalesces concurrent flush calls so a write is never replayed twice', async () => {
    const queue = new OfflineQueue({ storage: createMemoryOfflineQueueStorage() })
    await queue.enqueue({ method: 'POST', path: '/once', body: {} })
    let release!: () => void
    const client = api({
      post: vi.fn(
        () =>
          new Promise((resolve) => {
            release = () => resolve({ ok: true })
          }),
      ) as ApiClient['post'],
    })
    const processor = new OfflineCommandProcessor(queue, client)

    const first = processor.flush()
    const second = processor.flush()
    await vi.waitFor(() => expect(client.post).toHaveBeenCalledOnce())
    release()
    await Promise.all([first, second])

    expect(client.post).toHaveBeenCalledOnce()
  })

  it('dead-letters terminal 4xx errors and invokes rollback coordination', async () => {
    const queue = new OfflineQueue({ storage: createMemoryOfflineQueueStorage() })
    await queue.enqueue({
      method: 'POST',
      path: '/invalid',
      body: {},
      optimisticContext: { localId: 'temp-1' },
    })
    const onDeadLetter = vi.fn()
    const client = api({
      post: vi.fn(async () => {
        throw new ApiError('Validation failed', 422)
      }) as ApiClient['post'],
    })

    const result = await new OfflineCommandProcessor(queue, client, { onDeadLetter }).flush()

    expect(result.deadLettered).toBe(1)
    expect((await queue.getDeadLetters())[0]?.lastError).toBe('Validation failed')
    expect(onDeadLetter).toHaveBeenCalledWith(
      expect.objectContaining({ optimisticContext: { localId: 'temp-1' } }),
      expect.any(ApiError),
    )
  })

  it('retries transient failures later and preserves dependent command order', async () => {
    let now = new Date('2026-07-25T00:00:00.000Z')
    const queue = new OfflineQueue({
      storage: createMemoryOfflineQueueStorage(),
      now: () => now,
      retryDelay: 1_000,
    })
    await queue.enqueue({ method: 'POST', path: '/parent', body: {} })
    await queue.enqueue({ method: 'POST', path: '/child', body: {} })
    const post = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Unavailable', 503))
      .mockResolvedValue({ ok: true })
    const processor = new OfflineCommandProcessor(queue, api({ post: post as ApiClient['post'] }))

    expect(await processor.flush()).toEqual({
      flushed: 0,
      failed: 1,
      deadLettered: 0,
      deferred: 0,
    })
    expect(post).toHaveBeenCalledOnce()
    expect((await queue.getAll())[0]?.attempts).toBe(1)

    expect((await processor.flush()).deferred).toBe(2)
    expect(post).toHaveBeenCalledOnce()
    now = new Date('2026-07-25T00:00:01.000Z')
    expect((await processor.flush()).flushed).toBe(2)
    expect(post).toHaveBeenCalledTimes(3)
  })
})
