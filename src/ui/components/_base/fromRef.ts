/**
 * Resolves a "from-ref" value in component configs.
 *
 * Components can reference other components' values via `{ "from": "componentId" }`.
 * This function resolves those references against the current screen state.
 *
 * @example
 * // In a component config:
 * { "data": { "from": "userSearch" } }
 *
 * // resolveFromRef({ "from": "userSearch" }, screenValues)
 * // → screenValues["userSearch"]
 */
export function resolveFromRef<T>(
  value: T | { from: string },
  screenValues: Record<string, unknown>,
): T {
  if (value !== null && typeof value === 'object' && 'from' in value) {
    const ref = (value as { from: string }).from
    return screenValues[ref] as T
  }
  return value as T
}

/** Type guard: is this value a from-ref? */
export function isFromRef(value: unknown): value is { from: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'from' in value &&
    typeof (value as { from: string }).from === 'string'
  )
}
