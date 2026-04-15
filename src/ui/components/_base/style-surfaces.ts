import type { DesignTokens } from '../../tokens/types'
import { resolveNativeStyleProps } from './style-props'
import { resolveSurfaceStateOrder, type RuntimeSurfaceState } from './surface-state'

type SurfaceConfig = Record<string, unknown> & {
  states?: Partial<Record<RuntimeSurfaceState, SurfaceConfig>>
}

function toSurfaceConfig(value: Record<string, unknown> | undefined): SurfaceConfig | undefined {
  return value as SurfaceConfig | undefined
}

function stripStateMap(config: SurfaceConfig | undefined): SurfaceConfig | undefined {
  if (!config) {
    return undefined
  }

  const { states: _states, ...rest } = config
  return rest
}

function mergeSurfaceFields(
  base: SurfaceConfig | undefined,
  override: SurfaceConfig | undefined,
): SurfaceConfig | undefined {
  if (!base && !override) {
    return undefined
  }

  if (!base) {
    return override ? { ...override } : undefined
  }

  if (!override) {
    return { ...base }
  }

  const merged: SurfaceConfig = {
    ...base,
    ...override,
  }

  if (base.states || override.states) {
    const states: Partial<Record<RuntimeSurfaceState, SurfaceConfig>> = {}
    const names = new Set<RuntimeSurfaceState>([
      ...(Object.keys(base.states ?? {}) as RuntimeSurfaceState[]),
      ...(Object.keys(override.states ?? {}) as RuntimeSurfaceState[]),
    ])

    for (const name of names) {
      states[name] = mergeSurfaceFields(base.states?.[name], override.states?.[name])
    }

    merged.states = states
  }

  return merged
}

export function resolveSurfacePresentation(params: {
  tokens: DesignTokens
  implementationBase?: Record<string, unknown>
  componentSurface?: Record<string, unknown>
  itemSurface?: Record<string, unknown>
  activeStates?: RuntimeSurfaceState[]
}): {
  style?: Record<string, unknown>
  resolvedConfigForWrapper?: Record<string, unknown>
} {
  const implementationBase = toSurfaceConfig(params.implementationBase)
  const componentSurface = toSurfaceConfig(params.componentSurface)
  const itemSurface = toSurfaceConfig(params.itemSurface)
  const activeStates = resolveSurfaceStateOrder(params.activeStates ?? [])

  let merged = mergeSurfaceFields(
    stripStateMap(implementationBase),
    stripStateMap(componentSurface),
  )
  merged = mergeSurfaceFields(merged, stripStateMap(itemSurface))

  for (const state of activeStates) {
    merged = mergeSurfaceFields(merged, implementationBase?.states?.[state])
    merged = mergeSurfaceFields(merged, componentSurface?.states?.[state])
    merged = mergeSurfaceFields(merged, itemSurface?.states?.[state])
  }

  const wrapperConfig = merged as Record<string, unknown> | undefined

  return {
    style: wrapperConfig ? resolveNativeStyleProps(wrapperConfig, params.tokens) : undefined,
    resolvedConfigForWrapper: wrapperConfig,
  }
}
