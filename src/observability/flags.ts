export interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercent: number
  killSwitch: boolean
}

export class FeatureFlagController {
  private flags = new Map<string, FeatureFlag>()

  replace(flags: FeatureFlag[]): void {
    const next = new Map<string, FeatureFlag>()
    for (const flag of flags) {
      if (!flag.key.trim()) throw new Error('Feature flag key is required')
      if (flag.rolloutPercent < 0 || flag.rolloutPercent > 100) {
        throw new Error('Rollout percent must be between 0 and 100')
      }
      next.set(flag.key, structuredClone(flag))
    }
    this.flags = next
  }

  isEnabled(key: string, stableSubjectId: string): boolean {
    const flag = this.flags.get(key)
    if (!flag || !flag.enabled || flag.killSwitch) return false
    return stableBucket(`${key}:${stableSubjectId}`) < flag.rolloutPercent
  }

  snapshot(): FeatureFlag[] {
    return [...this.flags.values()].map((flag) => structuredClone(flag))
  }
}

function stableBucket(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 100
}
