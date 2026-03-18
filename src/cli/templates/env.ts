import type { PocketshotScaffoldConfig } from '../types'

export function envTemplate(config: PocketshotScaffoldConfig): string {
  const lines = ['EXPO_PUBLIC_API_URL=http://localhost:3000']
  if (config.webSocket) lines.push('EXPO_PUBLIC_WS_URL=ws://localhost:3000')
  return lines.join('\n') + '\n'
}
