export function normalizeBlankSlateSystemPath(path: string): string {
  const match = /^(?:blankslate|pocketshot-blankslate):\/\/join\/([^/?#]+)/i.exec(path)
  if (!match) return path
  try {
    return `/join/${encodeURIComponent(decodeURIComponent(match[1]))}`
  } catch {
    return '/'
  }
}
