import { z } from 'zod'
import type { RealtimeEvent, RealtimeSnapshot } from './types'

const cursorSchema = z.number().int().nonnegative()

export function createRealtimeEventSchema<TPayload>(payload: z.ZodType<TPayload>) {
  return z.object({
    version: z.number().int().positive(),
    channel: z.string().min(1),
    id: z.string().min(1),
    cursor: cursorSchema,
    type: z.string().min(1),
    timestamp: z.string().min(1),
    payload,
  }) as z.ZodType<RealtimeEvent<TPayload>>
}

export function createRealtimeSnapshotSchema<TState>(state: z.ZodType<TState>) {
  return z.object({
    version: z.number().int().positive(),
    channel: z.string().min(1),
    cursor: cursorSchema,
    state,
  }) as z.ZodType<RealtimeSnapshot<TState>>
}
