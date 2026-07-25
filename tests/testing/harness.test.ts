import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { bindDraftLifecycle, DurableDraftController } from '../../src/drafts/controller'
import { OfflineQueue } from '../../src/offline/queue'
import { bindRealtimeLifecycle } from '../../src/realtime/channel'
import type { RealtimeChannel } from '../../src/realtime/channel'
import { DeterministicClock } from '../../src/testing/clock'
import { disorderEvents } from '../../src/testing/events'
import { FaultSequence } from '../../src/testing/faults'
import { ReliabilityHarness } from '../../src/testing/harness'
import {
  createRestartableDraftStorage,
  createRestartableOfflineStorage,
  createRestartableRealtimeStorage,
} from '../../src/testing/storage-adapters'

describe('DeterministicClock', () => {
  it('executes equal-time timers deterministically and supports cancellation', async () => {
    const clock = new DeterministicClock(1_000)
    const calls: string[] = []
    clock.setTimer(() => calls.push('first'), 50)
    const cancelled = clock.setTimer(() => calls.push('cancelled'), 25)
    clock.setTimer(() => calls.push('second'), 50)
    clock.clearTimer(cancelled)

    await clock.advance(49)
    expect(calls).toEqual([])
    await clock.advance(1)
    expect(calls).toEqual(['first', 'second'])
    expect(clock.now()).toBe(1_050)
  })

  it('runs timers scheduled by timers without using wall-clock sleeps', async () => {
    const clock = new DeterministicClock(0)
    const calls: number[] = []
    clock.setTimer(() => {
      calls.push(1)
      clock.setTimer(() => calls.push(2), 20)
    }, 10)
    await clock.runAll()
    expect(calls).toEqual([1, 2])
    expect(clock.now()).toBe(30)
  })
})

describe('ReliabilityHarness', () => {
  it('drives lifecycle and network flaps with monotonic generations', async () => {
    const harness = new ReliabilityHarness()
    const lifecycle: string[] = []
    const network: boolean[] = []
    harness.lifecycle.onBackground(() => lifecycle.push('background'))
    harness.lifecycle.onForeground(() => lifecycle.push('foreground'))
    harness.network.subscribe((state) => network.push(state.isConnected))

    harness.lifecycle.transition('background')
    harness.lifecycle.transition('active')
    await harness.network.flap(2)

    expect(lifecycle).toEqual(['background', 'foreground'])
    expect(network).toEqual([true, false, true, false, true])
    expect(harness.network.snapshot.generation).toBe(4)
  })

  it('persists queued writes, draft state, and realtime cursors through restart', async () => {
    const harness = new ReliabilityHarness()
    const offlineStorage = createRestartableOfflineStorage(harness.processStore)
    const queue = new OfflineQueue({ storage: offlineStorage, createId: () => 'command-1' })
    await queue.enqueue({ method: 'POST', path: '/writes', body: { value: 1 } })

    const draftStorage = createRestartableDraftStorage(harness.processStore)
    const draft = new DurableDraftController({
      id: 'draft-1',
      initialValue: { title: '' },
      storage: draftStorage,
      publishSchema: z.object({ title: z.string().min(1) }),
      saveRemote: async ({ value }) => ({ value, version: '1' }),
    })
    await draft.initialize()
    await draft.update({ title: 'Recovered' })

    const cursorStorage = createRestartableRealtimeStorage(harness.processStore)
    await cursorStorage.saveCursor('room:1', 42)
    expect(harness.restartProcess()).toBe(1)

    const restartedQueue = new OfflineQueue({ storage: offlineStorage })
    expect((await restartedQueue.getAll())[0]?.idempotencyKey).toBe('command-1')
    expect((await draftStorage.load<{ title: string }>('draft-1'))?.value.title).toBe('Recovered')
    expect(await cursorStorage.loadCursor('room:1')).toBe(42)
  })

  it('binds the same lifecycle source to realtime and draft controllers', async () => {
    const harness = new ReliabilityHarness()
    const realtime = {
      pause: vi.fn(),
      resume: vi.fn(async () => undefined),
    } as unknown as RealtimeChannel<unknown, unknown>
    const unbindRealtime = bindRealtimeLifecycle(realtime, harness.lifecycle)

    const saveRemote = vi.fn(async ({ value }) => ({ value, version: '1' }))
    const draft = new DurableDraftController({
      id: 'draft-1',
      initialValue: { value: 0 },
      storage: createRestartableDraftStorage(harness.processStore),
      publishSchema: z.object({ value: z.number() }),
      saveRemote,
    })
    await draft.initialize()
    await draft.update({ value: 1 })
    const unbindDraft = bindDraftLifecycle(draft, harness.lifecycle)

    harness.lifecycle.transition('background')
    await vi.waitFor(() => expect(saveRemote).toHaveBeenCalledOnce())
    harness.lifecycle.transition('active')
    await vi.waitFor(() => expect(realtime.resume).toHaveBeenCalledOnce())

    expect(realtime.pause).toHaveBeenCalledOnce()
    unbindRealtime()
    unbindDraft()
  })
})

describe('fault and event scripting', () => {
  it('scripts auth refresh and recovery outcomes exactly', async () => {
    const refresh = new FaultSequence<[], string>()
      .reject(new Error('expired refresh'))
      .resolve('new-token')
    await expect(refresh.invoke()).rejects.toThrow('expired refresh')
    await expect(refresh.invoke()).resolves.toBe('new-token')
    expect(refresh.calls).toHaveLength(2)
  })

  it('reorders, duplicates, and drops events declaratively', () => {
    expect(
      disorderEvents(['one', 'two', 'three'], {
        order: [2, 0, 1],
        duplicate: [2],
        drop: [1],
      }),
    ).toEqual(['three', 'three', 'one'])
  })

  it('interrupts and resumes a transfer without losing its attempt record', async () => {
    const harness = new ReliabilityHarness()
    harness.transfer.interrupt()
    let completed = false
    const transfer = harness.transfer
      .send({ uploadId: 'upload-1', offset: 100, bytes: 50 })
      .then(() => {
        completed = true
      })
    await Promise.resolve()
    expect(completed).toBe(false)
    harness.transfer.resume()
    await transfer
    expect(harness.transfer.attempts).toEqual([{ uploadId: 'upload-1', offset: 100, bytes: 50 }])
  })
})
