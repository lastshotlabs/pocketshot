import { describe, expect, it } from 'vitest'
import { RealtimeReconciler } from '../../src/realtime/reconciler'
import type { RealtimeEvent } from '../../src/realtime/types'

type State = { values: string[] }

function event(cursor: number, id = `event-${cursor}`): RealtimeEvent<string> {
  return {
    version: 1,
    channel: 'room:1',
    id,
    cursor,
    type: 'added',
    timestamp: '2026-07-25T00:00:00.000Z',
    payload: String(cursor),
  }
}

describe('RealtimeReconciler', () => {
  it('buffers out-of-order events and applies them exactly once in cursor order', () => {
    const reconciler = new RealtimeReconciler<string, State>(
      (state, next) => ({ values: [...state.values, next.payload] }),
      10,
    )
    reconciler.applySnapshot({ version: 1, channel: 'room:1', cursor: 0, state: { values: [] } })

    const gap = reconciler.push(event(2))
    expect(gap.gap).toBe(true)
    expect(reconciler.state).toEqual({ values: [] })

    const filled = reconciler.push(event(1))
    expect(filled.applied.map((item) => item.cursor)).toEqual([1, 2])
    expect(reconciler.state).toEqual({ values: ['1', '2'] })
    expect(reconciler.cursor).toBe(2)

    expect(reconciler.push(event(2)).duplicate).toBe(true)
    expect(reconciler.push(event(3, 'event-2')).duplicate).toBe(true)
    expect(reconciler.state).toEqual({ values: ['1', '2'] })
  })

  it('reconciles buffered events on top of an authoritative snapshot', () => {
    const reconciler = new RealtimeReconciler<string, State>((state, next) => ({
      values: [...state.values, next.payload],
    }))
    reconciler.push(event(4))
    reconciler.push(event(3))

    const result = reconciler.applySnapshot({
      version: 1,
      channel: 'room:1',
      cursor: 2,
      state: { values: ['snapshot'] },
    })

    expect(result.applied.map((item) => item.cursor)).toEqual([3, 4])
    expect(result.state).toEqual({ values: ['snapshot', '3', '4'] })
    expect(result.gap).toBe(false)
  })

  it('reports bounded-buffer overflow instead of growing without limit', () => {
    const reconciler = new RealtimeReconciler<string, State>((state) => state, 2)
    reconciler.applySnapshot({ version: 1, channel: 'room:1', cursor: 0, state: { values: [] } })

    reconciler.push(event(4))
    reconciler.push(event(5))
    const result = reconciler.push(event(6))

    expect(result.overflow).toBe(true)
    expect(reconciler.bufferedCount).toBe(2)
  })
})
