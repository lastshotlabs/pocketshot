export interface RestartableStoreSnapshot {
  generation: number
  values: Record<string, unknown>
}

export class RestartableStore {
  private generationValue = 0
  private values = new Map<string, unknown>()

  read<T>(key: string): T | null {
    const value = this.values.get(key)
    return value === undefined ? null : clone(value as T)
  }

  write<T>(key: string, value: T): void {
    this.values.set(key, clone(value))
  }

  remove(key: string): void {
    this.values.delete(key)
  }

  restart(): RestartableStore {
    this.generationValue += 1
    return this
  }

  snapshot(): RestartableStoreSnapshot {
    return {
      generation: this.generationValue,
      values: Object.fromEntries(
        [...this.values.entries()].map(([key, value]) => [key, clone(value)]),
      ),
    }
  }

  restore(snapshot: RestartableStoreSnapshot): void {
    this.generationValue = snapshot.generation
    this.values = new Map(
      Object.entries(snapshot.values).map(([key, value]) => [key, clone(value)]),
    )
  }

  get generation(): number {
    return this.generationValue
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
