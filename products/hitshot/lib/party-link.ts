export function normalizePartySystemPath(path: string): string {
  const value = path.trim()
  const join =
    /^(?:hitshot|pocketshot-party):\/\/\/?join\/([^/?#]+)/i.exec(value) ??
    /^https:\/\/links\.hitshot\.app\/join\/([^/?#]+)/i.exec(value) ??
    /^\/?join\/([^/?#]+)/i.exec(value)
  if (!join) return value

  try {
    return `/join/${encodeURIComponent(decodeURIComponent(join[1]))}`
  } catch {
    return '/'
  }
}
