import type { RealtimeChannelStorage } from './types'

export class MemoryRealtimeStorage implements RealtimeChannelStorage {
  private readonly cursors = new Map<string, number>()

  async loadCursor(channel: string): Promise<number | null> {
    return this.cursors.get(channel) ?? null
  }

  async saveCursor(channel: string, cursor: number): Promise<void> {
    this.cursors.set(channel, cursor)
  }

  async clearCursor(channel: string): Promise<void> {
    this.cursors.delete(channel)
  }
}
