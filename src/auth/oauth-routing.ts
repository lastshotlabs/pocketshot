export interface NativeOAuthCallback {
  provider: 'apple' | 'google'
  code: string | null
  state: string | null
  error: string | null
  errorDescription: string | null
}

export function normalizeOAuthSystemPath(path: string, schemes: readonly string[]): string {
  const escaped = schemes.map((scheme) => scheme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const match = new RegExp(`^(?:${escaped.join('|')}):\\/\\/oauth\\/(apple|google)(.*)$`, 'i').exec(
    path,
  )
  if (!match) return path
  const suffix = match[2] ?? ''
  const query = suffix.startsWith('?')
    ? suffix
    : suffix.includes('?')
      ? suffix.slice(suffix.indexOf('?'))
      : ''
  const params = new URLSearchParams(query)
  const safe = new URLSearchParams()
  for (const key of ['code', 'state', 'error', 'error_description']) {
    const value = params.get(key)
    if (value) safe.set(key, value)
  }
  const encoded = safe.toString()
  return `/oauth/${match[1].toLowerCase()}${encoded ? `?${encoded}` : ''}`
}

export function parseOAuthCallback(
  provider: string | string[] | undefined,
  params: Record<string, string | string[] | undefined>,
): NativeOAuthCallback | null {
  const selectedProvider = Array.isArray(provider) ? provider[0] : provider
  if (selectedProvider !== 'apple' && selectedProvider !== 'google') return null
  const value = (key: string): string | null => {
    const candidate = params[key]
    const selected = Array.isArray(candidate) ? candidate[0] : candidate
    return selected?.trim() || null
  }
  return {
    provider: selectedProvider,
    code: value('code'),
    state: value('state'),
    error: value('error'),
    errorDescription: value('error_description'),
  }
}
