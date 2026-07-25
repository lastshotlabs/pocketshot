export interface BulkMutationResult<T> {
  succeeded: T[]
  failed: Array<{ id: T; error: unknown }>
}

export class DraftBulkSelection<T> {
  private readonly selected = new Set<T>()

  toggle(id: T): void {
    if (this.selected.has(id)) this.selected.delete(id)
    else this.selected.add(id)
  }

  select(ids: Iterable<T>): void {
    for (const id of ids) this.selected.add(id)
  }

  deselect(ids: Iterable<T>): void {
    for (const id of ids) this.selected.delete(id)
  }

  clear(): void {
    this.selected.clear()
  }

  has(id: T): boolean {
    return this.selected.has(id)
  }

  values(): T[] {
    return [...this.selected]
  }

  get size(): number {
    return this.selected.size
  }
}

export async function runBulkDraftMutation<T>(
  ids: readonly T[],
  mutate: (id: T) => Promise<void>,
  concurrency = 4,
): Promise<BulkMutationResult<T>> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('Bulk mutation concurrency must be a positive integer')
  }
  const succeeded: T[] = []
  const failed: Array<{ id: T; error: unknown }> = []
  let nextIndex = 0
  const worker = async () => {
    while (nextIndex < ids.length) {
      const id = ids[nextIndex++]
      if (id === undefined) continue
      try {
        await mutate(id)
        succeeded.push(id)
      } catch (error) {
        failed.push({ id, error })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, () => worker()))
  return { succeeded, failed }
}
