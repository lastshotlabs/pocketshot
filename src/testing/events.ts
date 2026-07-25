export interface EventDeliveryOptions {
  order?: readonly number[]
  duplicate?: readonly number[]
  drop?: readonly number[]
}

export function disorderEvents<T>(events: readonly T[], options: EventDeliveryOptions): T[] {
  const dropped = new Set(options.drop ?? [])
  const duplicated = new Set(options.duplicate ?? [])
  const order = options.order ?? events.map((_, index) => index)
  const delivered: T[] = []
  for (const index of order) {
    if (!Number.isInteger(index) || index < 0 || index >= events.length) {
      throw new Error(`Event disorder index is out of bounds: ${index}`)
    }
    if (dropped.has(index)) continue
    delivered.push(events[index]!)
    if (duplicated.has(index)) delivered.push(events[index]!)
  }
  return delivered
}
