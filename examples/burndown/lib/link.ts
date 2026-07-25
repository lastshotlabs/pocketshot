export function normalizeBurndownSystemPath(path: string): string {
  return normalizeJoinPath(path, 'pocketshot-burndown')
}

function normalizeJoinPath(path: string, scheme: string): string {
  const match = new RegExp(`^${scheme}:\\/\\/join\\/([^/?#]+)`, 'i').exec(path)
  if (!match) return path
  try {
    return `/join/${encodeURIComponent(decodeURIComponent(match[1]))}`
  } catch {
    return '/'
  }
}
