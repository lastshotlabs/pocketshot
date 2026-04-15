import {
  applyTransform,
  getNestedValue,
  isFromRef as isSharedFromRef,
  type FromRef,
} from '@lastshotlabs/frontend-contract/refs'

/**
 * Resolves a "from-ref" value in component configs.
 *
 * Components can reference other components' values via `{ "from": "componentId" }`
 * or nested paths like `{ "from": "componentId.value" }`.
 * This function resolves those references against the current screen state.
 *
 * @example
 * // In a component config:
 * { "data": { "from": "userSearch" } }
 *
 * // resolveFromRef({ "from": "userSearch" }, screenValues)
 * // → screenValues["userSearch"]
 */
export function resolveFromRef<T>(value: T | FromRef, screenValues: Record<string, unknown>): T {
  if (isSharedFromRef(value)) {
    const resolved = getNestedValue(screenValues, value.from)
    return applyTransform(resolved, value.transform, value.transformArg) as T
  }
  return value as T
}

/** Type guard: is this value a from-ref? */
export function isFromRef(value: unknown): value is FromRef {
  return isSharedFromRef(value)
}
