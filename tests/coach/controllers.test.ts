import { describe, expect, it, vi } from 'vitest'
import {
  EntitlementController,
  GoalController,
  MetricLogController,
  WorkoutController,
  convertMeasurement,
  type BillingAdapter,
  type EntitlementVerifier,
  type StoreEntitlement,
} from '../../src/coach/controllers'

describe('MetricLogController', () => {
  it('rejects malformed and over-capacity device records', () => {
    const metrics = new MetricLogController(1)
    expect(() =>
      metrics.log({ clientId: '', kind: 'weight', value: 1, unit: 'kg', recordedAt: 'bad' }),
    ).toThrow('invalid')
    metrics.log({ clientId: 'one', kind: 'weight', value: 1, unit: 'kg', recordedAt: '2026-07-25' })
    expect(() =>
      metrics.log({ clientId: 'two', kind: 'weight', value: 2, unit: 'kg', recordedAt: '2026-07-25' }),
    ).toThrow('capacity')
  })
  it('deduplicates offline logs and acknowledges the server record', () => {
    const metrics = new MetricLogController()
    const input = {
      clientId: 'client-1',
      kind: 'weight',
      value: 80,
      unit: 'kg' as const,
      recordedAt: '2026-07-25T12:00:00.000Z',
    }
    metrics.log(input)
    metrics.log(input)
    metrics.acknowledge('client-1', {
      id: 'server-1',
      kind: 'weight',
      value: 80,
      unit: 'kg',
      recordedAt: input.recordedAt,
    })
    expect(metrics.snapshot.records).toEqual([
      expect.objectContaining({ id: 'server-1', status: 'synced' }),
    ])
  })

  it('makes server conflicts explicit and supports either resolution', () => {
    const metrics = new MetricLogController()
    metrics.log({
      clientId: 'client-1',
      kind: 'weight',
      value: 80,
      unit: 'kg',
      recordedAt: '2026-07-25',
    })
    metrics.acknowledge('client-1', {
      id: 'server-1',
      kind: 'weight',
      value: 82,
      unit: 'kg',
      recordedAt: '2026-07-25',
    })
    expect(metrics.snapshot.conflicts).toHaveLength(1)
    metrics.resolve('client-1', 'use_server')
    expect(metrics.snapshot).toMatchObject({
      conflicts: [],
      records: [expect.objectContaining({ value: 82, status: 'synced' })],
    })
  })

  it('returns chart history in the requested unit', () => {
    const metrics = new MetricLogController()
    metrics.log({
      clientId: 'one',
      kind: 'weight',
      value: 100,
      unit: 'kg',
      recordedAt: '2026-07-24',
    })
    metrics.acknowledge('one', {
      id: 'server-one',
      kind: 'weight',
      value: 100,
      unit: 'kg',
      recordedAt: '2026-07-24',
    })
    expect(metrics.chart('weight', 'lb')[0].value).toBeCloseTo(220.462, 3)
  })
})

describe('GoalController', () => {
  it('validates goals and computes unit-safe progress', () => {
    const goals = new GoalController()
    goals.save({
      id: 'goal',
      metric: 'weight',
      target: 220.46226218,
      unit: 'lb',
      deadline: null,
    })
    expect(goals.progress('goal', 50, 'kg')).toBeCloseTo(0.5, 5)
    expect(() =>
      goals.save({
        id: 'bad',
        metric: 'steps',
        target: 0,
        unit: 'count',
        deadline: null,
      }),
    ).toThrow('positive')
  })
})

describe('WorkoutController', () => {
  const program = {
    id: 'strength',
    name: 'Strength',
    exercises: [{ id: 'squat', name: 'Squat', targetSets: 3, targetReps: 5 }],
  }

  it('builds a program, deduplicates sets, and completes a workout', () => {
    const workouts = new WorkoutController()
    workouts.saveProgram(program)
    workouts.start('session', 'strength', '2026-07-25T12:00:00.000Z')
    const set = {
      id: 'set-1',
      exerciseId: 'squat',
      reps: 5,
      load: 100,
      unit: 'kg' as const,
      completedAt: '2026-07-25T12:05:00.000Z',
    }
    workouts.logSet(set)
    workouts.logSet(set)
    workouts.complete('2026-07-25T12:30:00.000Z')
    expect(workouts.snapshot.session).toMatchObject({
      status: 'complete',
      sets: [set],
    })
  })

  it('restores an interrupted active workout', () => {
    const first = new WorkoutController()
    first.saveProgram(program)
    first.start('session', 'strength', '2026-07-25T12:00:00.000Z')
    const persisted = first.snapshot.session!

    const restarted = new WorkoutController()
    restarted.saveProgram(program)
    restarted.restore(persisted)
    restarted.logSet({
      id: 'set-1',
      exerciseId: 'squat',
      reps: 5,
      load: 100,
      unit: 'kg',
      completedAt: '2026-07-25T12:05:00.000Z',
    })
    expect(restarted.snapshot.session?.sets).toHaveLength(1)
  })

  it('tracks offline mutations and resolves server conflicts without losing local work', () => {
    const workouts = new WorkoutController()
    workouts.saveProgram(program)
    workouts.start('session', 'strength', '2026-07-25T12:00:00.000Z')
    workouts.logSet({
      id: 'set-1',
      exerciseId: 'squat',
      reps: 5,
      load: 100,
      unit: 'kg',
      completedAt: '2026-07-25T12:05:00.000Z',
    })
    expect(workouts.snapshot.sync).toMatchObject({
      status: 'pending',
      pendingMutationIds: ['start:session', 'set:set-1'],
    })
    workouts.acknowledgeMutation('start:session')
    workouts.failSync('Offline')
    expect(workouts.snapshot.sync.status).toBe('failed')

    workouts.rejectWithConflict(
      {
        id: 'session',
        programId: 'strength',
        status: 'active',
        startedAt: '2026-07-25T12:00:00.000Z',
        completedAt: null,
        sets: [],
        rest: null,
      },
      'Server version advanced',
    )
    expect(workouts.snapshot.sync.status).toBe('conflict')
    workouts.resolveConflict('keep-local', 'resolve:session:v2')
    expect(workouts.snapshot.session?.sets).toHaveLength(1)
    expect(workouts.snapshot.sync).toMatchObject({
      status: 'pending',
      pendingMutationIds: ['set:set-1', 'resolve:session:v2'],
    })

    workouts.rejectWithConflict(
      {
        id: 'session',
        programId: 'strength',
        status: 'complete',
        startedAt: '2026-07-25T12:00:00.000Z',
        completedAt: '2026-07-25T12:20:00.000Z',
        sets: [],
        rest: null,
      },
      'Workout completed elsewhere',
    )
    workouts.resolveConflict('accept-server')
    expect(workouts.snapshot).toMatchObject({
      session: { status: 'complete', sets: [] },
      sync: { status: 'synced', pendingMutationIds: [] },
    })
  })

  it('edits sets and reconciles a rest timer across background and pause', () => {
    let now = 1_000
    const workouts = new WorkoutController(() => now)
    workouts.saveProgram(program)
    workouts.start('session', 'strength', '2026-07-25T12:00:00.000Z')
    workouts.logSet({
      id: 'set-1',
      exerciseId: 'squat',
      reps: 5,
      load: 100,
      unit: 'kg',
      completedAt: '2026-07-25T12:05:00.000Z',
    })
    workouts.editSet('set-1', { reps: 6, load: 105 })
    expect(workouts.snapshot.session?.sets[0]).toMatchObject({ reps: 6, load: 105 })
    workouts.startRest(60_000)
    now = 31_000
    workouts.pauseRest()
    now = 100_000
    expect(workouts.restRemainingMs()).toBe(30_000)
    workouts.resumeRest()
    now = 130_000
    expect(workouts.reconcileRest()).toBe(true)
    expect(workouts.snapshot.session?.rest?.completed).toBe(true)
    workouts.removeSet('set-1')
    expect(workouts.snapshot.session?.sets).toEqual([])
  })

  it('rejects malformed restored sessions and redacts sync diagnostics', () => {
    const workouts = new WorkoutController()
    workouts.saveProgram(program)
    expect(() =>
      workouts.restore({
        id: 'session',
        programId: 'strength',
        status: 'active',
        startedAt: 'bad',
        completedAt: null,
        sets: [],
      }),
    ).toThrow('invalid')
    workouts.start('session', 'strength', '2026-07-25T12:00:00Z')
    workouts.failSync('Bearer abc.secret for user@example.com')
    expect(workouts.snapshot.sync.error).toBe('[REDACTED] for [REDACTED]')
  })
})

describe('EntitlementController', () => {
  function adapter(): BillingAdapter {
    return {
      purchase: vi.fn(async (productId: string) => ({
        productId,
        state: 'active' as const,
        expiresAt: '2026-08-25',
      })),
      restore: vi.fn(async () => [
        { productId: 'pro', state: 'grace' as const, expiresAt: '2026-07-28' },
      ]),
      refresh: vi.fn(async () => [
        { productId: 'pro', state: 'expired' as const, expiresAt: '2026-07-20' },
      ]),
    }
  }

  it('purchases, restores grace access, and expires after refresh', async () => {
    const billing = new EntitlementController(adapter())
    await billing.purchase('pro')
    expect(billing.canAccess('pro')).toBe(true)
    await billing.restore()
    expect(billing.canAccess('pro')).toBe(true)
    await billing.refresh()
    expect(billing.canAccess('pro')).toBe(false)
  })

  it('surfaces store failures without leaving loading stuck', async () => {
    const failing: BillingAdapter = {
      purchase: async () => {
        throw new Error('Store unavailable')
      },
      restore: async () => [],
      refresh: async () => [],
    }
    const billing = new EntitlementController(failing)
    await expect(billing.purchase('pro')).rejects.toThrow('Store unavailable')
    expect(billing.snapshot).toMatchObject({ isLoading: false, error: 'Error' })
  })

  it('keeps pending and revoked products locked', async () => {
    const pending: BillingAdapter = {
      purchase: async (productId) => ({ productId, state: 'pending', expiresAt: null }),
      restore: async () => [{ productId: 'pro', state: 'revoked', expiresAt: null }],
      refresh: async () => [],
    }
    const billing = new EntitlementController(pending)
    await billing.purchase('pro')
    expect(billing.canAccess('pro')).toBe(false)
    await billing.restore()
    expect(billing.snapshot.entitlements[0].state).toBe('revoked')
    expect(billing.canAccess('pro')).toBe(false)
  })

  it('uses the server-verified entitlement as the access authority', async () => {
    const store = adapter()
    const verifier: EntitlementVerifier = {
      verify: vi.fn(async (entitlement) => ({
        ...entitlement,
        state: 'revoked' as const,
        verificationToken: undefined,
      })),
    }
    const billing = new EntitlementController(store, verifier)
    await billing.purchase('pro')
    expect(verifier.verify).toHaveBeenCalledWith(expect.objectContaining({ state: 'active' }))
    expect(billing.snapshot.entitlements[0].verificationToken).toBeUndefined()
    expect(billing.canAccess('pro')).toBe(false)
  })

  it('rejects a verifier response for a different product', async () => {
    const verifier: EntitlementVerifier = {
      verify: async (entitlement) => ({ ...entitlement, productId: 'other' }),
    }
    const billing = new EntitlementController(adapter(), verifier)
    await expect(billing.purchase('pro')).rejects.toThrow('does not match')
    expect(billing.canAccess('pro')).toBe(false)
  })

  it('treats restore and refresh as authoritative and clears stale access', async () => {
    const store = adapter()
    const billing = new EntitlementController(store)
    await billing.purchase('pro')
    expect(billing.canAccess('pro')).toBe(true)
    ;(store.refresh as ReturnType<typeof vi.fn>).mockResolvedValue([])

    await billing.refresh()

    expect(billing.canAccess('pro')).toBe(false)
    expect(billing.snapshot.entitlements).toEqual([])
  })

  it('enforces expiry locally and never exposes verification tokens', async () => {
    const store: BillingAdapter = {
      purchase: async (productId) => ({
        productId,
        state: 'active',
        expiresAt: '2026-07-26T00:00:00.000Z',
        verificationToken: 'store-secret',
      }),
      restore: async () => [],
      refresh: async () => [],
    }
    const billing = new EntitlementController(store, undefined, {
      now: () => new Date('2026-07-26T00:00:00.000Z'),
    })
    await billing.purchase('pro')

    expect(billing.canAccess('pro')).toBe(false)
    expect(billing.snapshot.entitlements[0]?.verificationToken).toBeUndefined()
    expect(JSON.stringify(billing.snapshot)).not.toContain('store-secret')
  })

  it('serializes overlapping authoritative operations', async () => {
    let releaseRestore!: () => void
    const store: BillingAdapter = {
      purchase: async (productId) => ({ productId, state: 'active', expiresAt: null }),
      restore: vi.fn(
        () =>
          new Promise<StoreEntitlement[]>((resolve) => {
            releaseRestore = () =>
              resolve([{ productId: 'pro', state: 'active' as const, expiresAt: null }])
          }),
      ),
      refresh: vi.fn(async () => []),
    }
    const billing = new EntitlementController(store)
    const restore = billing.restore()
    const refresh = billing.refresh()
    await vi.waitFor(() => expect(store.restore).toHaveBeenCalledOnce())
    expect(store.refresh).not.toHaveBeenCalled()
    releaseRestore()
    await Promise.all([restore, refresh])

    expect(store.refresh).toHaveBeenCalledOnce()
    expect(billing.canAccess('pro')).toBe(false)
  })
})

describe('convertMeasurement', () => {
  it('converts supported dimensions and rejects incompatible units', () => {
    expect(convertMeasurement(2.54, 'cm', 'in')).toBeCloseTo(1)
    expect(() => convertMeasurement(1, 'kg', 'cm')).toThrow('Cannot convert')
  })
})
