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

    expect(result).toEqual({
      flushed: 2,
      failed: 0,
      deadLettered: 0,
      deferred: 0,
      authorizationRequired: false,
      cancelled: false,
    })
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
    expect((await queue.getDeadLetters())[0]?.lastError).toBe('Request failed (422)')
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
      authorizationRequired: false,
      cancelled: false,
    })
    expect(post).toHaveBeenCalledOnce()
    expect((await queue.getAll())[0]?.attempts).toBe(1)

    expect((await processor.flush()).deferred).toBe(2)
    expect(post).toHaveBeenCalledOnce()
    now = new Date('2026-07-25T00:00:01.000Z')
    expect((await processor.flush()).flushed).toBe(2)
    expect(post).toHaveBeenCalledTimes(3)
  })

  it('pauses without dead-lettering when authorization must be restored', async () => {
    const queue = new OfflineQueue({ storage: createMemoryOfflineQueueStorage() })
    await queue.enqueue({ method: 'POST', path: '/protected', body: {} })
    const onAuthorizationRequired = vi.fn()
    const processor = new OfflineCommandProcessor(
      queue,
      api({
        post: vi.fn(async () => {
          throw new ApiError('secret server detail', 401)
        }) as ApiClient['post'],
      }),
      { onAuthorizationRequired },
    )

    const result = await processor.flush()

    expect(result.authorizationRequired).toBe(true)
    expect(result.deadLettered).toBe(0)
    expect(result.deferred).toBe(1)
    expect((await queue.getAll())[0]?.lastError).toBe('Request failed (401)')
    expect(onAuthorizationRequired).toHaveBeenCalledOnce()
  })

  it('uses server retry-after hints within the configured queue cap', async () => {
    let now = new Date('2026-07-25T00:00:00.000Z')
    const queue = new OfflineQueue({
      storage: createMemoryOfflineQueueStorage(),
      now: () => now,
      maxRetryDelay: 30_000,
    })
    await queue.enqueue({ method: 'POST', path: '/limited', body: {} })
    const processor = new OfflineCommandProcessor(
      queue,
      api({
        post: vi.fn(async () => {
          throw new ApiError('quota details', 429, undefined, undefined, 15_000)
        }) as ApiClient['post'],
      }),
    )

    await processor.flush()
    expect((await queue.getAll())[0]?.nextAttemptAt).toBe('2026-07-25T00:00:15.000Z')
    now = new Date('2026-07-25T00:00:14.999Z')
    expect(await queue.getReady()).toHaveLength(0)
  })

  it('aborts an active replay and leaves the command available', async () => {
    const queue = new OfflineQueue({ storage: createMemoryOfflineQueueStorage() })
    await queue.enqueue({ method: 'POST', path: '/slow', body: {} })
    const controller = new AbortController()
    const post = vi.fn(
      (_path: string, _body: unknown, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const error = new Error('Aborted')
            error.name = 'AbortError'
            reject(error)
          })
        }),
    )
    const flush = new OfflineCommandProcessor(
      queue,
      api({ post: post as ApiClient['post'] }),
    ).flush(controller.signal)
    await vi.waitFor(() => expect(post).toHaveBeenCalledOnce())
    controller.abort()

    const result = await flush
    expect(result.cancelled).toBe(true)
    expect(result.failed).toBe(0)
    expect(await queue.getReady()).toHaveLength(1)
  })
})
