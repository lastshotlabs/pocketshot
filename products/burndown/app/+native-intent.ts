import { normalizeBurndownSystemPath } from '../lib/link'

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return normalizeBurndownSystemPath(path)
}
