import { describe, expect, it, vi } from 'vitest'
import { ApiError, type ApiClient } from '../../src/api/client'
import { OptimisticOfflineMutations } from '../../src/offline/optimistic'
import { OfflineQueue, createMemoryOfflineQueueStorage } from '../../src/offline/queue'

function api(post: ApiClient['post']): ApiClient {
  return { post } as ApiClient
}

describe('OptimisticOfflineMutations', () => {
  it('durably queues before applying and commits after acknowledgement', async () => {
    const queue = new OfflineQueue({ storage: createMemoryOfflineQueueStorage() })
    const order: string[] = []
    const adapter = {
      apply: vi.fn(async () => {
        expect(await queue.getAll()).toHaveLength(1)
        order.push('apply')
      }),
      commit: vi.fn(() => {
        order.push('commit')
      }),
      rollback: vi.fn(),
    }
    const mutations = new OptimisticOfflineMutations(
      queue,
      api(vi.fn(async () => ({ ok: true })) as ApiClient['post']),
      adapter,
    )

    await mutations.enqueue({
      method: 'POST',
      path: '/items',
      body: { title: 'Local' },
      optimisticContext: { localId: 'local-1' },
    })
    await mutations.flush()

    expect(order).toEqual(['apply', 'commit'])
    expect(adapter.rollback).not.toHaveBeenCalled()
    expect(await queue.getAll()).toHaveLength(0)
  })

  it('rolls back terminal failures with durable optimistic context', async () => {
    const queue = new OfflineQueue({ storage: createMemoryOfflineQueueStorage() })
    const adapter = { apply: vi.fn(), rollback: vi.fn() }
    const mutations = new OptimisticOfflineMutations(
      queue,
      api(
        vi.fn(async () => {
          throw new ApiError('Gone', 410)
        }) as ApiClient['post'],
      ),
      adapter,
    )
    await mutations.enqueue({
      method: 'POST',
      path: '/items',
      body: {},
      optimisticContext: { localId: 'local-1' },
    })

    await mutations.flush()

    expect(adapter.rollback).toHaveBeenCalledWith(
      expect.objectContaining({ optimisticContext: { localId: 'local-1' } }),
      expect.any(ApiError),
    )
    expect(await queue.getDeadLetters()).toHaveLength(1)
  })

  it('reconciles queued and dead-letter state after process restart', async () => {
    const storage = createMemoryOfflineQueueStorage()
    const firstQueue = new OfflineQueue({ storage })
    const queued = await firstQueue.enqueue({ method: 'POST', path: '/queued', body: {} })
    const dead = await firstQueue.enqueue({ method: 'POST', path: '/dead', body: {} })
    await firstQueue.moveToDeadLetter(dead.id, 'terminal')

    const reconcile = vi.fn()
    const restarted = new OptimisticOfflineMutations(
      new OfflineQueue({ storage }),
      api(vi.fn() as ApiClient['post']),
      { apply: vi.fn(), rollback: vi.fn(), reconcile },
    )
    await restarted.recover()

    expect(reconcile).toHaveBeenCalledWith(
      [expect.objectContaining({ id: queued.id })],
      [expect.objectContaining({ id: dead.id, status: 'dead_letter' })],
    )
  })
})
