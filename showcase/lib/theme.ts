import { resolveTokens } from '@lastshotlabs/pocketshot/ui'
import type { DesignTokens } from '@lastshotlabs/pocketshot/ui'

export function getTokens(flavor: string, scheme: 'light' | 'dark'): DesignTokens {
  return resolveTokens({ flavor, colorScheme: scheme }, scheme)
}
