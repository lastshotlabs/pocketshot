export function normalizeBurndownSystemPath(path: string): string {
  return normalizeJoinPath(path, ['burndown', 'pocketshot-burndown'])
}

function normalizeJoinPath(path: string, schemes: string[]): string {
  const match = new RegExp(`^(?:${schemes.join('|')}):\\/\\/join\\/([^/?#]+)`, 'i').exec(path)
  if (!match) return path
  try {
    return `/join/${encodeURIComponent(decodeURIComponent(match[1]))}`
  } catch {
    return '/'
  }
}
