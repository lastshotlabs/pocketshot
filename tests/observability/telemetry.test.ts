import {
  DiagnosticsBuffer,
  DurableFeatureFlagController,
  FeatureFlagController,
  MemoryFeatureFlagStorage,
  OperationTelemetry,
  ServiceLevelIndicatorController,
  scrubTelemetryAttributes,
  type LifecycleEvent,
  type TelemetryClock,
  type TelemetrySink,
} from '../../src/observability'
import { describe, expect, it, vi } from 'vitest'

function clock(): TelemetryClock & { advance(ms: number): void } {
  let now = 100
  return {
    now: () => now,
    isoNow: () => new Date(now).toISOString(),
    advance: (ms) => {
      now += ms
    },
  }
}

describe('OperationTelemetry', () => {
  it('emits correlated start/success events with measured duration', async () => {
    const events: LifecycleEvent[] = []
    const time = clock()
    const telemetry = new OperationTelemetry(
      {
        emit: (event) => {
          events.push(event)
        },
      },
      time,
      's1',
    )
    const operation = await telemetry.start('realtime', 'reconnect', { attempt: 2 })
    time.advance(45)
    await operation.succeed({ recovered: true })
    await operation.fail(new Error('late failure'))
    expect(events).toEqual([
      expect.objectContaining({ outcome: 'started', correlationId: 's1:1' }),
      expect.objectContaining({
        outcome: 'succeeded',
        correlationId: 's1:1',
        durationMs: 45,
        attributes: { attempt: 2, recovered: true },
      }),
    ])
  })

  it('captures failures without leaking secret context', async () => {
    const sink: TelemetrySink = { emit: vi.fn(), captureException: vi.fn() }
    const telemetry = new OperationTelemetry(sink)
    const operation = await telemetry.start('billing', 'purchase', {
      receipt: 'store-secret',
      product: 'pro',
    })
    await operation.fail(new Error('user@example.com failed'))
    expect(sink.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        attributes: { receipt: '[REDACTED]', product: 'pro' },
      }),
    )
  })
})

describe('DiagnosticsBuffer', () => {
  it('is bounded and exports privacy-scrubbed errors', async () => {
    const diagnostics = new DiagnosticsBuffer(1)
    diagnostics.emit({
      name: 'launch',
      area: 'app',
      outcome: 'started',
      at: 'now',
      correlationId: 'one',
      attributes: {},
    })
    diagnostics.emit({
      name: 'launch',
      area: 'app',
      outcome: 'failed',
      at: 'later',
      correlationId: 'two',
      attributes: {},
    })
    diagnostics.captureException(new Error('Bearer abc.secret user@example.com'), {
      correlationId: 'two',
      area: 'app',
      attributes: {},
    })
    const exported = diagnostics.export()
    expect(exported).not.toContain('one')
    expect(exported).not.toContain('abc.secret')
    expect(exported).not.toContain('user@example.com')
  })
})

describe('scrubTelemetryAttributes', () => {
  it('redacts known secrets and rejects arbitrary structured payloads', () => {
    expect(
      scrubTelemetryAttributes({
        token: 'abc',
        text: 'contact me@example.com',
        object: { hidden: true },
        count: 2,
      }),
    ).toEqual({
      token: '[REDACTED]',
      text: 'contact [REDACTED]',
      object: '[UNSUPPORTED]',
      count: 2,
    })
  })
})

describe('FeatureFlagController', () => {
  it('supports deterministic rollout and an immediate kill switch', () => {
    const flags = new FeatureFlagController()
    flags.replace([{ key: 'new-feed', enabled: true, rolloutPercent: 100, killSwitch: false }])
    expect(flags.isEnabled('new-feed', 'person-1')).toBe(true)
    flags.replace([{ key: 'new-feed', enabled: true, rolloutPercent: 100, killSwitch: true }])
    expect(flags.isEnabled('new-feed', 'person-1')).toBe(false)
  })

  it('rejects duplicate flags and fails closed without a stable subject', () => {
    const flags = new FeatureFlagController()
    flags.replace([{ key: 'feed', enabled: true, rolloutPercent: 100, killSwitch: false }])
    expect(flags.isEnabled('feed', '')).toBe(false)
    expect(() =>
      flags.replace([
        { key: 'feed', enabled: true, rolloutPercent: 100, killSwitch: false },
        { key: 'feed', enabled: false, rolloutPercent: 0, killSwitch: false },
      ]),
    ).toThrow('Duplicate')
  })

  it('restores fresh durable flags and fails closed after expiry', async () => {
    const storage = new MemoryFeatureFlagStorage()
    let now = Date.parse('2026-07-26T00:00:00Z')
    const flags = new DurableFeatureFlagController(storage, () => now)
    await flags.replace({
      schemaVersion: 1,
      revision: 'r1',
      fetchedAt: '2026-07-26T00:00:00Z',
      expiresAt: '2026-07-27T00:00:00Z',
      flags: [{ key: 'coach', enabled: true, rolloutPercent: 100, killSwitch: false }],
    })
    const restored = new DurableFeatureFlagController(storage, () => now)
    await restored.initialize()
    expect(restored.isEnabled('coach', 'person')).toBe(true)
    now = Date.parse('2026-07-28T00:00:00Z')
    expect(restored.isEnabled('coach', 'person')).toBe(false)
  })

  it('validates rollout bounds and defaults missing flags off', () => {
    const flags = new FeatureFlagController()
    expect(flags.isEnabled('missing', 'person')).toBe(false)
    expect(() =>
      flags.replace([{ key: 'bad', enabled: true, rolloutPercent: 101, killSwitch: false }]),
    ).toThrow('between 0 and 100')
  })
})

describe('ServiceLevelIndicatorController', () => {
  it('tracks bounded success and latency windows with breach state', () => {
    const indicators = new ServiceLevelIndicatorController()
    indicators.define({
      name: 'join_success',
      target: 0.75,
      windowSize: 4,
      maximumDurationMs: 2_000,
    })
    indicators.record('join_success', { succeeded: true, durationMs: 500 })
    indicators.record('join_success', { succeeded: true, durationMs: 2_500 })
    indicators.record('join_success', { succeeded: false, durationMs: 100 })
    expect(indicators.snapshot('join_success')).toMatchObject({
      total: 3,
      good: 1,
      ratio: 1 / 3,
      breached: true,
    })
    indicators.record('join_success', { succeeded: true, durationMs: 500 })
    indicators.record('join_success', { succeeded: true, durationMs: 500 })
    expect(indicators.snapshot('join_success').total).toBe(4)
  })

  it('supports the release indicator catalog without provider coupling', () => {
    const indicators = new ServiceLevelIndicatorController()
    for (const name of [
      'crash_free_session',
      'launch_success',
      'reconnect_success',
      'queue_drain',
      'stream_completion',
      'upload_completion',
      'push_open_success',
    ]) {
      indicators.define({ name, target: 0.99, windowSize: 100 })
      indicators.record(name, { succeeded: true })
    }
    expect(indicators.all()).toHaveLength(7)
    expect(indicators.all().every((indicator) => !indicator.breached)).toBe(true)
  })
})
