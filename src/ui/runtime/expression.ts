import { getNestedValue } from '@lastshotlabs/frontend-contract/refs'

const runtimeExpressionHelpers = {
  defined(value: unknown) {
    return value !== undefined && value !== null && value !== ''
  },
  empty(value: unknown) {
    if (value == null) {
      return true
    }

    if (typeof value === 'string') {
      return value.trim().length === 0
    }

    if (Array.isArray(value)) {
      return value.length === 0
    }

    if (typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>).length === 0
    }

    return false
  },
  includes(collection: unknown, candidate: unknown) {
    if (Array.isArray(collection)) {
      return collection.includes(candidate)
    }

    if (typeof collection === 'string') {
      return collection.includes(String(candidate))
    }

    return false
  },
  length(value: unknown) {
    if (value == null) {
      return 0
    }

    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length
    }

    if (typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>).length
    }

    return 0
  },
}

function createExpressionScope(scope: Record<string, unknown>) {
  return new Proxy(scope, {
    has() {
      return true
    },
    get(target, property: string | symbol) {
      if (property === Symbol.unscopables) {
        return undefined
      }

      if (typeof property !== 'string') {
        return Reflect.get(target, property)
      }

      if (property in runtimeExpressionHelpers) {
        return runtimeExpressionHelpers[property as keyof typeof runtimeExpressionHelpers]
      }

      if (property in target) {
        return target[property]
      }

      return undefined
    },
  })
}

export function isExprRef(value: unknown): value is { expr: string } {
  return (
    value != null &&
    typeof value === 'object' &&
    'expr' in value &&
    typeof (value as { expr?: unknown }).expr === 'string'
  )
}

export function evaluateRuntimeExpression(
  expression: string,
  scope: Record<string, unknown>,
): unknown {
  const trimmed = expression.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    const evaluator = new Function('scope', `with (scope) { return (${trimmed}); }`) as (
      scope: Record<string, unknown>,
    ) => unknown

    return evaluator(createExpressionScope(scope) as unknown as Record<string, unknown>)
  } catch {
    return getNestedValue(scope, trimmed)
  }
}
