export type LifecycleArea =
  | 'app'
  | 'auth'
  | 'deep_link'
  | 'realtime'
  | 'offline_queue'
  | 'media'
  | 'ai'
  | 'audio'
  | 'billing'
  | 'notification'
  | 'moderation'

export type LifecycleOutcome = 'started' | 'succeeded' | 'failed' | 'cancelled'

export interface LifecycleEvent {
  name: string
  area: LifecycleArea
  outcome: LifecycleOutcome
  at: string
  correlationId: string
  durationMs?: number
  attributes: Record<string, string | number | boolean | null>
}

export interface TelemetrySink {
  emit(event: LifecycleEvent): void | Promise<void>
  captureException?(
    error: Error,
    context: {
      correlationId: string
      area: LifecycleArea
      attributes: Record<string, string | number | boolean | null>
    },
  ): void | Promise<void>
}

export interface TelemetryClock {
  now(): number
  isoNow(): string
}

export interface OperationHandle {
  correlationId: string
  succeed(attributes?: Record<string, unknown>): Promise<void>
  fail(error: unknown, attributes?: Record<string, unknown>): Promise<void>
  cancel(attributes?: Record<string, unknown>): Promise<void>
}

const sensitiveKey =
  /authorization|cookie|email|password|phone|secret|token|answer|receipt|address/i
const sensitiveValue = /(?:bearer\s+[a-z0-9._~-]+)|(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi

export class OperationTelemetry {
  private sequence = 0

  constructor(
    private readonly sink: TelemetrySink,
    private readonly clock: TelemetryClock = systemTelemetryClock,
    private readonly sessionId = 'anonymous',
  ) {}

  async start(
    area: LifecycleArea,
    name: string,
    attributes: Record<string, unknown> = {},
  ): Promise<OperationHandle> {
    const startedAt = this.clock.now()
    const correlationId = `${this.sessionId}:${++this.sequence}`
    await this.sink.emit({
      name,
      area,
      outcome: 'started',
      at: this.clock.isoNow(),
      correlationId,
      attributes: scrubTelemetryAttributes(attributes),
    })

    let finished = false
    const finish = async (
      outcome: Exclude<LifecycleOutcome, 'started'>,
      extra: Record<string, unknown> = {},
      error?: unknown,
    ) => {
      if (finished) return
      finished = true
      const event = {
        name,
        area,
        outcome,
        at: this.clock.isoNow(),
        correlationId,
        durationMs: Math.max(0, this.clock.now() - startedAt),
        attributes: scrubTelemetryAttributes({ ...attributes, ...extra }),
      } satisfies LifecycleEvent
      await this.sink.emit(event)
      if (error && this.sink.captureException) {
        await this.sink.captureException(normalizeError(error), {
          correlationId,
          area,
          attributes: event.attributes,
        })
      }
    }

    return {
      correlationId,
      succeed: (extra) => finish('succeeded', extra),
      fail: (error, extra) => finish('failed', extra, error),
      cancel: (extra) => finish('cancelled', extra),
    }
  }
}

export class DiagnosticsBuffer implements TelemetrySink {
  private events: LifecycleEvent[] = []
  private exceptions: {
    name: string
    message: string
    correlationId: string
    area: LifecycleArea
  }[] = []

  constructor(private readonly capacity = 100) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Capacity must be positive')
  }

  emit(event: LifecycleEvent): void {
    this.events.push(structuredClone(event))
    this.trim()
  }

  captureException(
    error: Error,
    context: {
      correlationId: string
      area: LifecycleArea
      attributes: Record<string, string | number | boolean | null>
    },
  ): void {
    this.exceptions.push({
      name: error.name,
      message: scrubText(error.message),
      correlationId: context.correlationId,
      area: context.area,
    })
    if (this.exceptions.length > this.capacity) this.exceptions.shift()
  }

  export(): string {
    return JSON.stringify({
      schemaVersion: 1,
      events: structuredClone(this.events),
      exceptions: structuredClone(this.exceptions),
    })
  }

  private trim(): void {
    if (this.events.length > this.capacity) this.events.shift()
  }
}

export function scrubTelemetryAttributes(
  attributes: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => {
      if (sensitiveKey.test(key)) return [key, '[REDACTED]']
      if (value === null || typeof value === 'number' || typeof value === 'boolean') {
        return [key, value]
      }
      if (typeof value === 'string') return [key, scrubText(value).slice(0, 500)]
      return [key, '[UNSUPPORTED]']
    }),
  )
}

function scrubText(value: string): string {
  return value.replace(sensitiveValue, '[REDACTED]')
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

const systemTelemetryClock: TelemetryClock = {
  now: () => Date.now(),
  isoNow: () => new Date().toISOString(),
}
