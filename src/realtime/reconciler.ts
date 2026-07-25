import type { RealtimeEvent, RealtimeSnapshot } from './types'

export interface ReconcilerResult<TState> {
  state: TState | null
  cursor: number | null
  applied: RealtimeEvent[]
  duplicate: boolean
  gap: boolean
  overflow: boolean
}

export class RealtimeReconciler<TPayload, TState> {
  private currentState: TState | null = null
  private currentCursor: number | null = null
  private readonly buffered = new Map<number, RealtimeEvent<TPayload>>()
  private readonly seenIds = new Set<string>()

  constructor(
    private readonly reduce: (state: TState, event: RealtimeEvent<TPayload>) => TState,
    private readonly maxBufferedEvents = 256,
  ) {}

  get state(): TState | null {
    return this.currentState
  }

  get cursor(): number | null {
    return this.currentCursor
  }

  get bufferedCount(): number {
    return this.buffered.size
  }

  applySnapshot(snapshot: RealtimeSnapshot<TState>): ReconcilerResult<TState> {
    this.currentState = snapshot.state
    this.currentCursor = snapshot.cursor

    for (const [cursor, event] of this.buffered) {
      if (cursor <= snapshot.cursor) {
        this.seenIds.add(event.id)
        this.buffered.delete(cursor)
      }
    }

    return this.drain(false, false)
  }

  push(event: RealtimeEvent<TPayload>): ReconcilerResult<TState> {
    if (
      this.seenIds.has(event.id) ||
      (this.currentCursor !== null && event.cursor <= this.currentCursor) ||
      this.buffered.has(event.cursor)
    ) {
      return this.result([], true, false, false)
    }

    this.buffered.set(event.cursor, event)
    if (this.buffered.size > this.maxBufferedEvents) {
      this.buffered.delete(Math.max(...this.buffered.keys()))
      return this.result([], false, true, true)
    }

    if (this.currentState === null || this.currentCursor === null) {
      return this.result([], false, true, false)
    }

    return this.drain(false, false)
  }

  reset(): void {
    this.currentState = null
    this.currentCursor = null
    this.buffered.clear()
    this.seenIds.clear()
  }

  private drain(duplicate: boolean, overflow: boolean): ReconcilerResult<TState> {
    const applied: RealtimeEvent<TPayload>[] = []
    let nextCursor = (this.currentCursor ?? -1) + 1
    let next = this.buffered.get(nextCursor)

    while (this.currentState !== null && next) {
      this.buffered.delete(nextCursor)
      this.currentState = this.reduce(this.currentState, next)
      this.currentCursor = next.cursor
      this.seenIds.add(next.id)
      applied.push(next)
      nextCursor += 1
      next = this.buffered.get(nextCursor)
    }

    const gap =
      this.buffered.size > 0 &&
      this.currentCursor !== null &&
      Math.min(...this.buffered.keys()) > this.currentCursor + 1
    return this.result(applied, duplicate, gap, overflow)
  }

  private result(
    applied: RealtimeEvent<TPayload>[],
    duplicate: boolean,
    gap: boolean,
    overflow: boolean,
  ): ReconcilerResult<TState> {
    return {
      state: this.currentState,
      cursor: this.currentCursor,
      applied,
      duplicate,
      gap,
      overflow,
    }
  }
}
