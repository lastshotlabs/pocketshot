import type { PocketshotScaffoldConfig } from '../../types'

export function libConfigTemplate(config: PocketshotScaffoldConfig): string {
  const lines = [`export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'`]
  if (config.webSocket) {
    lines.push(`export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3000'`)
  }
  return lines.join('\n') + '\n'
}
