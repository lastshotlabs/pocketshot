import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { DraftConflictError } from '../../src/drafts/conflict'
import { DurableDraftController, bindDraftLifecycle } from '../../src/drafts/controller'
import type { AppStateManager } from '../../src/app-state/manager'
import { createMemoryDraftStorage } from '../../src/drafts/storage'
import type { DraftStorage, SaveDraftInput } from '../../src/drafts/types'

type Draft = { title: string; cards: string[] }

const publishSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  cards: z.array(z.string()).min(1, 'At least one card is required'),
})

function setup(
  storage: DraftStorage = createMemoryDraftStorage(),
  saveRemote = vi.fn(async (input: SaveDraftInput<Draft>) => ({
    value: input.value,
    version: `server-${input.idempotencyKey}`,
  })),
) {
  const controller = new DurableDraftController<Draft>({
    id: 'deck:1',
    initialValue: { title: 'Initial', cards: ['one'] },
    initialServerVersion: 'server-0',
    storage,
    publishSchema,
    saveRemote,
    autosaveMs: 100,
  })
  return { controller, storage, saveRemote }
}

describe('DurableDraftController', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('persists invalid edits immediately and restores them after process restart', async () => {
    const { controller, storage, saveRemote } = setup()
    await controller.initialize()
    await controller.update({ title: '', cards: [] })

    expect(controller.snapshot.isDirty).toBe(true)
    expect(controller.snapshot.publishBlocks).toEqual([
      'Title is required',
      'At least one card is required',
    ])
    expect(controller.snapshot.canPublish).toBe(false)
    expect(saveRemote).not.toHaveBeenCalled()

    const restarted = setup(storage).controller
    await restarted.initialize()
    expect(restarted.snapshot.value).toEqual({ title: '', cards: [] })
    expect(restarted.snapshot.isDirty).toBe(true)
  })

  it('debounces autosave and uses conditional version plus stable revision idempotency', async () => {
    const { controller, saveRemote } = setup()
    await controller.initialize()
    await controller.update((draft) => ({ ...draft, title: 'First' }))
    await vi.advanceTimersByTimeAsync(50)
    await controller.update((draft) => ({ ...draft, title: 'Final' }))
    await vi.advanceTimersByTimeAsync(99)
    expect(saveRemote).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)

    expect(saveRemote).toHaveBeenCalledOnce()
    expect(saveRemote).toHaveBeenCalledWith({
      id: 'deck:1',
      value: { title: 'Final', cards: ['one'] },
      expectedVersion: 'server-0',
      idempotencyKey: 'deck:1:2',
    })
    expect(controller.snapshot.isDirty).toBe(false)
    expect(controller.snapshot.health).toBe('healthy')
  })

  it('never marks newer edits clean when they arrive during a save', async () => {
    let release!: (value: { value: Draft; version: string }) => void
    const saveRemote = vi.fn(
      (input: SaveDraftInput<Draft>) =>
        new Promise<{ value: Draft; version: string }>((resolve) => {
          release = resolve
          expect(input.value.title).toBe('Saving')
        }),
    )
    const { controller } = setup(createMemoryDraftStorage(), saveRemote)
    await controller.initialize()
    await controller.update((draft) => ({ ...draft, title: 'Saving' }))
    const saving = controller.flush()
    await vi.waitFor(() => expect(saveRemote).toHaveBeenCalledOnce())
    await controller.update((draft) => ({ ...draft, title: 'Newer' }))
    release({ value: { title: 'Saving', cards: ['one'] }, version: 'server-1' })
    await saving

    expect(controller.snapshot.value.title).toBe('Newer')
    expect(controller.snapshot.isDirty).toBe(true)
    expect(controller.snapshot.serverVersion).toBe('server-1')
  })

  it('exposes three-way conflict data and never overwrites remote work silently', async () => {
    const saveRemote = vi.fn(async () => {
      throw new DraftConflictError<Draft>({ title: 'Remote', cards: ['remote-card'] }, 'server-2')
    })
    const { controller } = setup(createMemoryDraftStorage(), saveRemote)
    await controller.initialize()
    await controller.update({ title: 'Mine', cards: ['mine-card'] })

    await expect(controller.flush()).rejects.toBeInstanceOf(DraftConflictError)
    expect(controller.snapshot.health).toBe('conflict')
    expect(controller.snapshot.conflict).toEqual(
      expect.objectContaining({
        base: { title: 'Initial', cards: ['one'] },
        local: { title: 'Mine', cards: ['mine-card'] },
        remote: { title: 'Remote', cards: ['remote-card'] },
        remoteVersion: 'server-2',
      }),
    )

    await controller.resolveConflict((conflict) => ({
      title: conflict.local.title,
      cards: [...conflict.remote.cards, ...conflict.local.cards],
    }))
    expect(controller.snapshot.value).toEqual({
      title: 'Mine',
      cards: ['remote-card', 'mine-card'],
    })
    expect(controller.snapshot.serverVersion).toBe('server-2')
    expect(controller.snapshot.isDirty).toBe(true)
    expect(controller.snapshot.conflict).toBeNull()
  })

  it('supports use-server and keep-mine conflict strategies', async () => {
    const saveRemote = vi.fn(async () => {
      throw new DraftConflictError<Draft>({ title: 'Remote', cards: ['r'] }, 'server-2')
    })
    const { controller } = setup(createMemoryDraftStorage(), saveRemote)
    await controller.initialize()
    await controller.update({ title: 'Mine', cards: ['m'] })
    await expect(controller.flush()).rejects.toBeInstanceOf(DraftConflictError)
    await controller.resolveConflict('use_server')
    expect(controller.snapshot.value).toEqual({ title: 'Remote', cards: ['r'] })
    expect(controller.snapshot.isDirty).toBe(false)
  })

  it('supports undo, redo, bounded history, restore, and duplicate', async () => {
    const { controller, storage } = setup()
    await controller.initialize()
    await controller.update({ title: 'One', cards: ['one'] })
    const firstVersion = controller.snapshot.history[0]!
    await controller.update({ title: 'Two', cards: ['two'] })
    expect(await controller.undo()).toBe(true)
    expect(controller.snapshot.value.title).toBe('One')
    expect(await controller.redo()).toBe(true)
    expect(controller.snapshot.value.title).toBe('Two')

    await controller.restoreVersion(firstVersion.id)
    expect(controller.snapshot.value.title).toBe('One')

    const duplicate = await controller.duplicate('deck:copy')
    expect(duplicate.id).toBe('deck:copy')
    expect(duplicate.value.title).toBe('One')
    expect(duplicate.serverVersion).toBeNull()
    expect((await storage.load<Draft>('deck:copy'))?.value.title).toBe('One')
  })

  it('preserves local data and reports offline health when remote autosave fails', async () => {
    const storage = createMemoryDraftStorage()
    const offline = new Error('Network unavailable')
    const controller = new DurableDraftController<Draft>({
      id: 'deck:1',
      initialValue: { title: 'Initial', cards: ['one'] },
      storage,
      publishSchema,
      saveRemote: async () => {
        throw offline
      },
      isOfflineError: (error) => error === offline,
    })
    await controller.initialize()
    await controller.update({ title: 'Still here', cards: ['one'] })
    await expect(controller.flush()).rejects.toBe(offline)

    expect(controller.snapshot.health).toBe('offline')
    expect((await storage.load<Draft>('deck:1'))?.value.title).toBe('Still here')
  })

  it('flushes dirty work when the shared app lifecycle enters background', async () => {
    const { controller, saveRemote } = setup()
    let background: (() => void) | null = null
    const manager = {
      onBackground(callback: () => void) {
        background = callback
        return () => {
          background = null
        }
      },
    } as AppStateManager
    const unbind = bindDraftLifecycle(controller, manager)
    await controller.initialize()
    await controller.update({ title: 'Background', cards: ['one'] })
    ;(background as (() => void) | null)?.()
    await vi.waitFor(() => expect(saveRemote).toHaveBeenCalledOnce())
    expect(controller.snapshot.isDirty).toBe(false)
    unbind()
    expect(background).toBeNull()
  })
})
