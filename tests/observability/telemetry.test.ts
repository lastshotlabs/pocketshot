import {
  DiagnosticsBuffer,
  FeatureFlagController,
  OperationTelemetry,
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

  it('validates rollout bounds and defaults missing flags off', () => {
    const flags = new FeatureFlagController()
    expect(flags.isEnabled('missing', 'person')).toBe(false)
    expect(() =>
      flags.replace([{ key: 'bad', enabled: true, rolloutPercent: 101, killSwitch: false }]),
    ).toThrow('between 0 and 100')
  })
})
