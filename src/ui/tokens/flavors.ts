import type { TokenFlavor, ColorTokens } from './types'

// ── neutral ───────────────────────────────────────────────────────────────────
// Clean gray-based. Primary #18181b. Safe default.

const neutralLight: ColorTokens = {
  background: '#ffffff',
  surface: '#f9f9f9',
  surfaceAlt: '#f3f3f3',
  overlay: '#00000066' as `#${string}`,

  text: '#18181b',
  textMuted: '#71717a',
  textInverse: '#ffffff',

  primary: '#18181b',
  primaryForeground: '#ffffff',
  secondary: '#f4f4f5',
  secondaryForeground: '#18181b',
  accent: '#3f3f46',
  accentForeground: '#ffffff',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',

  border: '#e4e4e7',
  borderFocus: '#18181b',
  divider: '#f0f0f0',

  inputBackground: '#ffffff',
  inputBorder: '#d4d4d8',
  inputText: '#18181b',
  inputPlaceholder: '#a1a1aa',

  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  badgeBackground: '#f4f4f5',
  badgeForeground: '#3f3f46',
}

const neutralDark: ColorTokens = {
  background: '#09090b',
  surface: '#18181b',
  surfaceAlt: '#27272a',
  overlay: '#00000099' as `#${string}`,

  text: '#fafafa',
  textMuted: '#a1a1aa',
  textInverse: '#09090b',

  primary: '#fafafa',
  primaryForeground: '#18181b',
  secondary: '#27272a',
  secondaryForeground: '#fafafa',
  accent: '#3f3f46',
  accentForeground: '#fafafa',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#3b82f6',
  infoForeground: '#eff6ff',

  border: '#27272a',
  borderFocus: '#fafafa',
  divider: '#3f3f46',

  inputBackground: '#27272a',
  inputBorder: '#3f3f46',
  inputText: '#fafafa',
  inputPlaceholder: '#71717a',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#27272a',
  badgeForeground: '#a1a1aa',
}

// ── slate ─────────────────────────────────────────────────────────────────────
// Cool blue-grays. Primary #334155. Professional/corporate.

const slateLight: ColorTokens = {
  background: '#f8fafc',
  surface: '#f1f5f9',
  surfaceAlt: '#e2e8f0',
  overlay: '#00000066' as `#${string}`,

  text: '#0f172a',
  textMuted: '#64748b',
  textInverse: '#f8fafc',

  primary: '#334155',
  primaryForeground: '#f8fafc',
  secondary: '#e2e8f0',
  secondaryForeground: '#334155',
  accent: '#475569',
  accentForeground: '#f8fafc',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',

  border: '#cbd5e1',
  borderFocus: '#334155',
  divider: '#e2e8f0',

  inputBackground: '#ffffff',
  inputBorder: '#cbd5e1',
  inputText: '#0f172a',
  inputPlaceholder: '#94a3b8',

  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  badgeBackground: '#e2e8f0',
  badgeForeground: '#475569',
}

const slateDark: ColorTokens = {
  background: '#020617',
  surface: '#0f172a',
  surfaceAlt: '#1e293b',
  overlay: '#00000099' as `#${string}`,

  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textInverse: '#0f172a',

  primary: '#94a3b8',
  primaryForeground: '#0f172a',
  secondary: '#1e293b',
  secondaryForeground: '#f1f5f9',
  accent: '#475569',
  accentForeground: '#f1f5f9',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#3b82f6',
  infoForeground: '#eff6ff',

  border: '#1e293b',
  borderFocus: '#94a3b8',
  divider: '#334155',

  inputBackground: '#1e293b',
  inputBorder: '#334155',
  inputText: '#f1f5f9',
  inputPlaceholder: '#64748b',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#1e293b',
  badgeForeground: '#94a3b8',
}

// ── midnight ──────────────────────────────────────────────────────────────────
// Dark navy feel. Primary #1e3a5f. Deep blue tones. Elegant.

const midnightLight: ColorTokens = {
  background: '#f0f4f8',
  surface: '#e8f0f8',
  surfaceAlt: '#d6e4f0',
  overlay: '#00000066' as `#${string}`,

  text: '#0d1f2d',
  textMuted: '#4a6080',
  textInverse: '#f0f4f8',

  primary: '#1e3a5f',
  primaryForeground: '#f0f4f8',
  secondary: '#d6e4f0',
  secondaryForeground: '#1e3a5f',
  accent: '#2d5282',
  accentForeground: '#f0f4f8',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
  info: '#1d4ed8',
  infoForeground: '#ffffff',

  border: '#b8cfe0',
  borderFocus: '#1e3a5f',
  divider: '#d6e4f0',

  inputBackground: '#ffffff',
  inputBorder: '#b8cfe0',
  inputText: '#0d1f2d',
  inputPlaceholder: '#7a9ab8',

  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  badgeBackground: '#d6e4f0',
  badgeForeground: '#2d5282',
}

const midnightDark: ColorTokens = {
  background: '#040d18',
  surface: '#0a1628',
  surfaceAlt: '#112238',
  overlay: '#000000cc' as `#${string}`,

  text: '#e8f0f8',
  textMuted: '#7a9ab8',
  textInverse: '#0a1628',

  primary: '#4a8cc4',
  primaryForeground: '#040d18',
  secondary: '#112238',
  secondaryForeground: '#e8f0f8',
  accent: '#2d5282',
  accentForeground: '#e8f0f8',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#3b82f6',
  infoForeground: '#eff6ff',

  border: '#1a3050',
  borderFocus: '#4a8cc4',
  divider: '#1e3a5f',

  inputBackground: '#112238',
  inputBorder: '#1e3a5f',
  inputText: '#e8f0f8',
  inputPlaceholder: '#4a6080',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#112238',
  badgeForeground: '#7a9ab8',
}

// ── violet ────────────────────────────────────────────────────────────────────
// Purple accent. Primary #7c3aed. Rich purples. Creative/bold.

const violetLight: ColorTokens = {
  background: '#faf5ff',
  surface: '#f3e8ff',
  surfaceAlt: '#e9d5ff',
  overlay: '#00000066' as `#${string}`,

  text: '#2e1065',
  textMuted: '#7c3aed',
  textInverse: '#faf5ff',

  primary: '#7c3aed',
  primaryForeground: '#ffffff',
  secondary: '#ede9fe',
  secondaryForeground: '#4c1d95',
  accent: '#6d28d9',
  accentForeground: '#ffffff',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',

  border: '#ddd6fe',
  borderFocus: '#7c3aed',
  divider: '#ede9fe',

  inputBackground: '#ffffff',
  inputBorder: '#ddd6fe',
  inputText: '#2e1065',
  inputPlaceholder: '#a78bfa',

  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  badgeBackground: '#ede9fe',
  badgeForeground: '#6d28d9',
}

const violetDark: ColorTokens = {
  background: '#0d0520',
  surface: '#1a0a3c',
  surfaceAlt: '#2e1065',
  overlay: '#000000cc' as `#${string}`,

  text: '#f5f3ff',
  textMuted: '#c4b5fd',
  textInverse: '#1a0a3c',

  primary: '#8b5cf6',
  primaryForeground: '#0d0520',
  secondary: '#2e1065',
  secondaryForeground: '#f5f3ff',
  accent: '#7c3aed',
  accentForeground: '#f5f3ff',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#3b82f6',
  infoForeground: '#eff6ff',

  border: '#3b1a6e',
  borderFocus: '#8b5cf6',
  divider: '#4c1d95',

  inputBackground: '#2e1065',
  inputBorder: '#4c1d95',
  inputText: '#f5f3ff',
  inputPlaceholder: '#7c3aed',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#2e1065',
  badgeForeground: '#c4b5fd',
}

// ── rose ──────────────────────────────────────────────────────────────────────
// Pink/rose accent. Primary #e11d48. Warm, vibrant.

const roseLight: ColorTokens = {
  background: '#fff1f2',
  surface: '#ffe4e6',
  surfaceAlt: '#fecdd3',
  overlay: '#00000066' as `#${string}`,

  text: '#881337',
  textMuted: '#e11d48',
  textInverse: '#fff1f2',

  primary: '#e11d48',
  primaryForeground: '#ffffff',
  secondary: '#ffe4e6',
  secondaryForeground: '#881337',
  accent: '#be123c',
  accentForeground: '#ffffff',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  error: '#991b1b',
  errorForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',

  border: '#fda4af',
  borderFocus: '#e11d48',
  divider: '#fecdd3',

  inputBackground: '#ffffff',
  inputBorder: '#fda4af',
  inputText: '#881337',
  inputPlaceholder: '#fb7185',

  destructive: '#be123c',
  destructiveForeground: '#ffffff',

  badgeBackground: '#ffe4e6',
  badgeForeground: '#be123c',
}

const roseDark: ColorTokens = {
  background: '#1c0208',
  surface: '#3b0a14',
  surfaceAlt: '#57102a',
  overlay: '#000000cc' as `#${string}`,

  text: '#fff1f2',
  textMuted: '#fda4af',
  textInverse: '#3b0a14',

  primary: '#fb7185',
  primaryForeground: '#1c0208',
  secondary: '#57102a',
  secondaryForeground: '#fff1f2',
  accent: '#e11d48',
  accentForeground: '#fff1f2',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#3b82f6',
  infoForeground: '#eff6ff',

  border: '#6e1030',
  borderFocus: '#fb7185',
  divider: '#881337',

  inputBackground: '#57102a',
  inputBorder: '#881337',
  inputText: '#fff1f2',
  inputPlaceholder: '#e11d48',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#57102a',
  badgeForeground: '#fda4af',
}

// ── emerald ───────────────────────────────────────────────────────────────────
// Green accent. Primary #059669. Fresh, success-oriented.

const emeraldLight: ColorTokens = {
  background: '#f0fdf4',
  surface: '#dcfce7',
  surfaceAlt: '#bbf7d0',
  overlay: '#00000066' as `#${string}`,

  text: '#052e16',
  textMuted: '#059669',
  textInverse: '#f0fdf4',

  primary: '#059669',
  primaryForeground: '#ffffff',
  secondary: '#dcfce7',
  secondaryForeground: '#052e16',
  accent: '#047857',
  accentForeground: '#ffffff',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',

  border: '#86efac',
  borderFocus: '#059669',
  divider: '#bbf7d0',

  inputBackground: '#ffffff',
  inputBorder: '#86efac',
  inputText: '#052e16',
  inputPlaceholder: '#34d399',

  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  badgeBackground: '#dcfce7',
  badgeForeground: '#047857',
}

const emeraldDark: ColorTokens = {
  background: '#011208',
  surface: '#052e16',
  surfaceAlt: '#064e24',
  overlay: '#000000cc' as `#${string}`,

  text: '#ecfdf5',
  textMuted: '#6ee7b7',
  textInverse: '#052e16',

  primary: '#10b981',
  primaryForeground: '#011208',
  secondary: '#064e24',
  secondaryForeground: '#ecfdf5',
  accent: '#059669',
  accentForeground: '#ecfdf5',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#3b82f6',
  infoForeground: '#eff6ff',

  border: '#065f38',
  borderFocus: '#10b981',
  divider: '#047857',

  inputBackground: '#064e24',
  inputBorder: '#047857',
  inputText: '#ecfdf5',
  inputPlaceholder: '#059669',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#064e24',
  badgeForeground: '#6ee7b7',
}

// ── ocean ─────────────────────────────────────────────────────────────────────
// Teal/cyan accent. Primary #0891b2. Ocean blues and teals.

const oceanLight: ColorTokens = {
  background: '#f0f9ff',
  surface: '#e0f2fe',
  surfaceAlt: '#bae6fd',
  overlay: '#00000066' as `#${string}`,

  text: '#0c4a6e',
  textMuted: '#0891b2',
  textInverse: '#f0f9ff',

  primary: '#0891b2',
  primaryForeground: '#ffffff',
  secondary: '#e0f2fe',
  secondaryForeground: '#0c4a6e',
  accent: '#0e7490',
  accentForeground: '#ffffff',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
  info: '#0284c7',
  infoForeground: '#ffffff',

  border: '#7dd3fc',
  borderFocus: '#0891b2',
  divider: '#bae6fd',

  inputBackground: '#ffffff',
  inputBorder: '#7dd3fc',
  inputText: '#0c4a6e',
  inputPlaceholder: '#38bdf8',

  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  badgeBackground: '#e0f2fe',
  badgeForeground: '#0e7490',
}

const oceanDark: ColorTokens = {
  background: '#020f1a',
  surface: '#062030',
  surfaceAlt: '#0a3248',
  overlay: '#000000cc' as `#${string}`,

  text: '#e0f2fe',
  textMuted: '#7dd3fc',
  textInverse: '#062030',

  primary: '#22d3ee',
  primaryForeground: '#020f1a',
  secondary: '#0a3248',
  secondaryForeground: '#e0f2fe',
  accent: '#0891b2',
  accentForeground: '#e0f2fe',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#38bdf8',
  infoForeground: '#082f49',

  border: '#0c4a6e',
  borderFocus: '#22d3ee',
  divider: '#0e7490',

  inputBackground: '#0a3248',
  inputBorder: '#0e7490',
  inputText: '#e0f2fe',
  inputPlaceholder: '#0891b2',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#0a3248',
  badgeForeground: '#7dd3fc',
}

// ── sunset ────────────────────────────────────────────────────────────────────
// Warm orange/amber. Primary #ea580c. Warm sunset tones.

const sunsetLight: ColorTokens = {
  background: '#fff7ed',
  surface: '#ffedd5',
  surfaceAlt: '#fed7aa',
  overlay: '#00000066' as `#${string}`,

  text: '#431407',
  textMuted: '#ea580c',
  textInverse: '#fff7ed',

  primary: '#ea580c',
  primaryForeground: '#ffffff',
  secondary: '#ffedd5',
  secondaryForeground: '#431407',
  accent: '#c2410c',
  accentForeground: '#ffffff',

  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#b45309',
  warningForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',

  border: '#fdba74',
  borderFocus: '#ea580c',
  divider: '#fed7aa',

  inputBackground: '#ffffff',
  inputBorder: '#fdba74',
  inputText: '#431407',
  inputPlaceholder: '#fb923c',

  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  badgeBackground: '#ffedd5',
  badgeForeground: '#c2410c',
}

const sunsetDark: ColorTokens = {
  background: '#1a0800',
  surface: '#3a1200',
  surfaceAlt: '#571c00',
  overlay: '#000000cc' as `#${string}`,

  text: '#fff7ed',
  textMuted: '#fdba74',
  textInverse: '#3a1200',

  primary: '#fb923c',
  primaryForeground: '#1a0800',
  secondary: '#571c00',
  secondaryForeground: '#fff7ed',
  accent: '#ea580c',
  accentForeground: '#fff7ed',

  success: '#22c55e',
  successForeground: '#052e16',
  warning: '#f59e0b',
  warningForeground: '#451a03',
  error: '#ef4444',
  errorForeground: '#fff1f2',
  info: '#3b82f6',
  infoForeground: '#eff6ff',

  border: '#6e2600',
  borderFocus: '#fb923c',
  divider: '#7c2d12',

  inputBackground: '#571c00',
  inputBorder: '#7c2d12',
  inputText: '#fff7ed',
  inputPlaceholder: '#ea580c',

  destructive: '#ef4444',
  destructiveForeground: '#fff1f2',

  badgeBackground: '#571c00',
  badgeForeground: '#fdba74',
}

// ── flavor registry ───────────────────────────────────────────────────────────

const neutral: TokenFlavor = { name: 'neutral', light: neutralLight, dark: neutralDark }
const slate: TokenFlavor = { name: 'slate', light: slateLight, dark: slateDark }
const midnight: TokenFlavor = { name: 'midnight', light: midnightLight, dark: midnightDark }
const violet: TokenFlavor = { name: 'violet', light: violetLight, dark: violetDark }
const rose: TokenFlavor = { name: 'rose', light: roseLight, dark: roseDark }
const emerald: TokenFlavor = { name: 'emerald', light: emeraldLight, dark: emeraldDark }
const ocean: TokenFlavor = { name: 'ocean', light: oceanLight, dark: oceanDark }
const sunset: TokenFlavor = { name: 'sunset', light: sunsetLight, dark: sunsetDark }

export const flavors: Record<string, TokenFlavor> = {
  neutral,
  slate,
  midnight,
  violet,
  rose,
  emerald,
  ocean,
  sunset,
}

export const flavorNames = [
  'neutral',
  'slate',
  'midnight',
  'violet',
  'rose',
  'emerald',
  'ocean',
  'sunset',
] as const

export type FlavorName = typeof flavorNames[number]
