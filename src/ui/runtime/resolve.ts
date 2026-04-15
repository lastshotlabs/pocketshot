import {
  applyTransform,
  getNestedValue,
  isFromRef,
  type FromRef,
} from '@lastshotlabs/frontend-contract/refs'
import { evaluateRuntimeExpression, isExprRef } from './expression'

export interface ResolveRuntimeValueOptions {
  values?: Record<string, unknown>
  context?: Record<string, unknown>
}

export function resolveRuntimeTemplate(
  template: string,
  options: ResolveRuntimeValueOptions = {},
): string {
  if (!template.includes('{')) {
    return template
  }

  const scope = buildRuntimeScope(options)
  return template.replace(/\{([^}]+)\}/g, (match, token: string) => {
    const resolved = getNestedValue(scope, token.trim())
    return resolved == null ? match : String(resolved)
  })
}

export function resolveRuntimeValue<T>(value: T, options: ResolveRuntimeValueOptions = {}): T {
  const scope = buildRuntimeScope(options)
  return resolveRuntimeValueInternal(value, scope) as T
}

export function resolveFromRuntimeRef(
  ref: FromRef,
  options: ResolveRuntimeValueOptions = {},
): unknown {
  const scope = buildRuntimeScope(options)
  const resolved = getNestedValue(scope, ref.from)
  return applyTransform(resolved, ref.transform, ref.transformArg)
}

function buildRuntimeScope(options: ResolveRuntimeValueOptions): Record<string, unknown> {
  return {
    ...(options.values ?? {}),
    ...(options.context ?? {}),
  }
}

function resolveRuntimeValueInternal(value: unknown, scope: Record<string, unknown>): unknown {
  if (isFromRef(value)) {
    const resolved = getNestedValue(scope, value.from)
    return applyTransform(resolved, value.transform, value.transformArg)
  }

  if (isExprRef(value)) {
    return evaluateRuntimeExpression(value.expr, scope)
  }

  if (typeof value === 'string') {
    return resolveRuntimeTemplate(value, { context: scope })
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveRuntimeValueInternal(item, scope))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        resolveRuntimeValueInternal(nested, scope),
      ]),
    )
  }

  return value
}
