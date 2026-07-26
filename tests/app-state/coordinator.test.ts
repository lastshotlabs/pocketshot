import { describe, expect, it, vi } from 'vitest'
import { LifecycleCoordinator, createMemoryLifecycleStorage } from '../../src/app-state/coordinator'
import { bindLifecycleCoordinator } from '../../src/app-state/bridge'
import type { AppStateManager } from '../../src/app-state/manager'

describe('LifecycleCoordinator', () => {
  it('serializes ordered background and foreground reconciliation', async () => {
    const calls: string[] = []
    const coordinator = new LifecycleCoordinator({
      storage: createMemoryLifecycleStorage(),
      now: () => new Date('2026-07-25T12:00:00.000Z'),
    })
    coordinator.register({
      id: 'realtime',
      order: 20,
      background: () => {
        calls.push('realtime:background')
      },
      foreground: () => {
        calls.push('realtime:foreground')
      },
    })
    coordinator.register({
      id: 'drafts',
      order: 10,
      background: () => {
        calls.push('drafts:background')
      },
      foreground: () => {
        calls.push('drafts:foreground')
      },
    })
    await coordinator.initialize()
    await Promise.all([coordinator.transition('background'), coordinator.transition('active')])
    expect(calls).toEqual([
      'drafts:background',
      'realtime:background',
      'drafts:foreground',
      'realtime:foreground',
    ])
    expect(coordinator.checkpoint).toMatchObject({
      state: 'active',
      processGeneration: 1,
      failures: [],
    })
  })

  it('detects unclean process restart and reconciles without exposing task failures', async () => {
    const storage = createMemoryLifecycleStorage()
    const first = new LifecycleCoordinator({ storage })
    await first.initialize()
    await first.transition('background')

    const recovered = vi.fn()
    const errors = vi.fn()
    const second = new LifecycleCoordinator({
      storage,
      timeout: async () => {
        throw new Error('private backend detail')
      },
      onError: errors,
    })
    second.register({ id: 'queue', foreground: recovered })
    await second.initialize('active')
    expect(recovered).toHaveBeenCalledOnce()
    expect(errors).toHaveBeenCalledWith('queue', 'foreground', expect.any(Error))
    expect(second.checkpoint).toMatchObject({
      processGeneration: 2,
      cleanShutdown: false,
      failures: [
        {
          taskId: 'queue',
          phase: 'foreground',
          message: 'Error',
        },
      ],
    })
  })

  it('does not replay restart recovery after a clean shutdown and validates registrations', async () => {
    const storage = createMemoryLifecycleStorage()
    const first = new LifecycleCoordinator({ storage })
    await first.initialize()
    await first.markCleanShutdown()

    const recovered = vi.fn()
    const second = new LifecycleCoordinator({ storage })
    second.register({ id: 'queue', foreground: recovered })
    expect(() => second.register({ id: 'queue' })).toThrow('Duplicate')
    await second.initialize()
    expect(recovered).not.toHaveBeenCalled()
    await second.clear()
    expect(await storage.get()).toBeNull()
  })

  it('coalesces initialization and recovers its transition queue after storage failure', async () => {
    const backing = createMemoryLifecycleStorage()
    const get = vi.fn(() => backing.get())
    let fail = false
    const coordinator = new LifecycleCoordinator({
      storage: {
        get,
        clear: () => backing.clear(),
        set: async (value) => {
          if (fail) {
            fail = false
            throw new Error('disk unavailable')
          }
          await backing.set(value)
        },
      },
    })
    await Promise.all([coordinator.initialize(), coordinator.initialize()])
    expect(get).toHaveBeenCalledOnce()
    fail = true
    await expect(coordinator.transition('background')).rejects.toThrow('disk unavailable')
    await coordinator.transition('active')
    expect(coordinator.checkpoint.state).toBe('active')
  })

  it('bridges the single native lifecycle manager into durable transitions', async () => {
    let foreground: (() => void) | null = null
    let background: (() => void) | null = null
    const manager = {
      state: 'active',
      onForeground(callback: () => void) {
        foreground = callback
        return () => {
          foreground = null
        }
      },
      onBackground(callback: () => void) {
        background = callback
        return () => {
          background = null
        }
      },
    } as unknown as AppStateManager
    const coordinator = new LifecycleCoordinator({
      storage: createMemoryLifecycleStorage(),
    })
    const unbind = await bindLifecycleCoordinator(manager, coordinator)
    ;(background as (() => void) | null)?.()
    await vi.waitFor(() => expect(coordinator.checkpoint.state).toBe('background'))
    ;(foreground as (() => void) | null)?.()
    await vi.waitFor(() => expect(coordinator.checkpoint.state).toBe('active'))
    unbind()
    expect(foreground).toBeNull()
    expect(background).toBeNull()
  })
})
