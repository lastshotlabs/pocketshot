export function normalizePartySystemPath(path: string): string {
  const join = /^(?:hitshot|pocketshot-party):\/\/join\/([^/?#]+)/i.exec(path)
  if (!join) return path

  try {
    return `/join/${encodeURIComponent(decodeURIComponent(join[1]))}`
  } catch {
    return '/'
  }
}
