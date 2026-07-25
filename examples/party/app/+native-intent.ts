import { normalizePartySystemPath } from '../lib/party-link'

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return normalizePartySystemPath(path)
}
