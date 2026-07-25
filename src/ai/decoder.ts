import type { AiStreamEvent } from './types'

/** Strictly decodes a server stream frame without silently accepting malformed deltas. */
export function decodeAiStreamEvent(value: unknown): AiStreamEvent {
  if (!value || typeof value !== 'object') throw new Error('[pocketshot] Malformed AI stream event')
  const event = value as Record<string, unknown>
  if (
    typeof event.type !== 'string' ||
    typeof event.sequence !== 'number' ||
    !Number.isInteger(event.sequence) ||
    event.sequence < 1 ||
    typeof event.attemptId !== 'string'
  ) {
    throw new Error('[pocketshot] Malformed AI stream envelope')
  }
  switch (event.type) {
    case 'delta':
      if (typeof event.text !== 'string') break
      return event as unknown as AiStreamEvent
    case 'part':
      if (!('part' in event)) break
      return event as unknown as AiStreamEvent
    case 'citation':
      if (isObject(event.citation) && typeof event.citation.id === 'string') {
        return event as unknown as AiStreamEvent
      }
      break
    case 'action':
      if (
        isObject(event.action) &&
        typeof event.action.id === 'string' &&
        typeof event.action.kind === 'string'
      ) {
        return event as unknown as AiStreamEvent
      }
      break
    case 'usage':
      if (
        isObject(event.usage) &&
        typeof event.usage.inputTokens === 'number' &&
        typeof event.usage.outputTokens === 'number'
      ) {
        return event as unknown as AiStreamEvent
      }
      break
    case 'complete':
      return event as unknown as AiStreamEvent
    case 'error':
      if (typeof event.error === 'string') return event as unknown as AiStreamEvent
      break
  }
  throw new Error(`[pocketshot] Malformed AI ${event.type} event`)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}
