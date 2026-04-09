import { useEffect, useCallback } from 'react'
import { Appearance } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { atom, useAtom } from 'jotai'
import { resolveTokens } from '../ui/tokens/resolve'
import type { DesignTokens, DeepPartial } from '../ui/tokens/types'
import { flavors, type FlavorName } from '../ui/tokens/flavors'

// ── Storage key ───────────────────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'pocketshot_theme_config'

// ── Atoms ─────────────────────────────────────────────────────────────────────
// These are module-scoped so they're shared across a single SDK instance.
// In practice there is one SDK instance per app (createPocketshot is called once).

/** The user's chosen color scheme preference ('light' | 'dark' | 'system'). */
const colorSchemeAtom = atom<'light' | 'dark' | 'system'>('system')

/** The active flavor name. */
const flavorAtom = atom<FlavorName>('neutral')

/** Runtime overrides applied on top of the resolved base tokens. */
const overridesAtom = atom<DeepPartial<DesignTokens>>({})

// ── System scheme helper ───────────────────────────────────────────────────────

function getSystemScheme(): 'light' | 'dark' {
  const scheme = Appearance.getColorScheme()
  return scheme === 'dark' ? 'dark' : 'light'
}

// ── Persistence ───────────────────────────────────────────────────────────────

async function loadPersistedTheme(): Promise<{
  flavor: FlavorName
  colorScheme: 'light' | 'dark' | 'system'
} | null> {
  try {
    const raw = await SecureStore.getItemAsync(THEME_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { flavor: FlavorName; colorScheme: 'light' | 'dark' | 'system' }
  } catch {
    return null
  }
}

async function persistTheme(
  flavor: FlavorName,
  colorScheme: 'light' | 'dark' | 'system',
): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, JSON.stringify({ flavor, colorScheme }))
  } catch {
    // SecureStore not available in some test environments — ignore
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseThemeReturn {
  /** Fully resolved design tokens for the current theme. */
  tokens: DesignTokens
  /** The active flavor name (e.g. 'neutral', 'violet'). */
  flavor: FlavorName
  /** The user's chosen color scheme preference. */
  colorScheme: 'light' | 'dark' | 'system'
  /** The actual rendered scheme after resolving 'system'. */
  activeScheme: 'light' | 'dark'
  /** Change the active flavor. Persists to SecureStore. */
  setFlavor: (name: FlavorName) => void
  /** Change the color scheme preference. Persists to SecureStore. */
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void
  /** Apply runtime token overrides (merged on top of base tokens). */
  setOverrides: (overrides: DeepPartial<DesignTokens>) => void
  /** List of all available flavor names. */
  availableFlavors: FlavorName[]
}

/**
 * Returns the current design tokens and theme controls.
 *
 * On first mount, loads any persisted theme preference from SecureStore and
 * subscribes to Appearance changes so 'system' mode tracks OS dark/light mode.
 *
 * @example
 * const { tokens, setFlavor, setColorScheme } = useTheme()
 * // tokens.colors.primary → '#7c3aed' (in violet flavor)
 */
export function useTheme(): UseThemeReturn {
  const [colorScheme, setColorSchemeAtom] = useAtom(colorSchemeAtom)
  const [flavor, setFlavorAtom] = useAtom(flavorAtom)
  const [overrides, setOverridesAtom] = useAtom(overridesAtom)

  const systemScheme = getSystemScheme()
  const activeScheme = colorScheme === 'system' ? systemScheme : colorScheme

  const currentTokens: DesignTokens = resolveTokens(
    { flavor, colorScheme, overrides },
    systemScheme,
  )

  // Load persisted theme on mount
  useEffect(() => {
    void loadPersistedTheme().then((saved) => {
      if (saved) {
        setFlavorAtom(saved.flavor)
        setColorSchemeAtom(saved.colorScheme)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subscribe to system appearance changes to force re-render when OS theme changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      // Updating overrides atom with its current value triggers a re-render
      // so that getSystemScheme() is called fresh and tokens are recomputed.
      setOverridesAtom((prev) => ({ ...prev }))
    })
    return () => sub.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setFlavor = useCallback(
    (name: FlavorName) => {
      setFlavorAtom(name)
      void persistTheme(name, colorScheme)
    },
    [colorScheme, setFlavorAtom],
  )

  const setColorScheme = useCallback(
    (scheme: 'light' | 'dark' | 'system') => {
      setColorSchemeAtom(scheme)
      void persistTheme(flavor, scheme)
    },
    [flavor, setColorSchemeAtom],
  )

  const setOverrides = useCallback(
    (next: DeepPartial<DesignTokens>) => {
      setOverridesAtom(next)
    },
    [setOverridesAtom],
  )

  return {
    tokens: currentTokens,
    flavor,
    colorScheme,
    activeScheme,
    setFlavor,
    setColorScheme,
    setOverrides,
    availableFlavors: Object.keys(flavors) as FlavorName[],
  }
}
