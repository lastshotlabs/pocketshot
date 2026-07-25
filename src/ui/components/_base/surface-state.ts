import {
  SURFACE_STATE_NAMES,
  type SurfaceStateName,
} from '@lastshotlabs/frontend-contract/components'

export type RuntimeSurfaceState = SurfaceStateName

export const CANONICAL_STATE_ORDER: RuntimeSurfaceState[] = [...SURFACE_STATE_NAMES]

export function resolveSurfaceStateOrder(states: RuntimeSurfaceState[]): RuntimeSurfaceState[] {
  const seen = new Set<RuntimeSurfaceState>()
  return CANONICAL_STATE_ORDER.filter((state) => {
    if (!states.includes(state) || seen.has(state)) {
      return false
    }

    seen.add(state)
    return true
  })
}
