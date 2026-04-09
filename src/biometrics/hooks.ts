import { useCallback, useEffect, useState } from 'react'
import type { BiometricAuthResult, BiometricAvailability, BiometricPromptOptions } from './types'

// ── Optional peer dep loader ───────────────────────────────────────────────────

interface LocalAuthModule {
  hasHardwareAsync(): Promise<boolean>
  isEnrolledAsync(): Promise<boolean>
  supportedAuthenticationTypesAsync(): Promise<number[]>
  authenticateAsync(options: {
    promptMessage: string
    cancelLabel: string
    fallbackLabel: string
    disableDeviceFallback: boolean
  }): Promise<{ success: boolean; error?: string; warning?: string }>
}

function requireLocalAuth(): LocalAuthModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-local-authentication') as LocalAuthModule
  } catch {
    throw new Error(
      '[pocketshot] Biometrics requires expo-local-authentication.\nInstall it: npx expo install expo-local-authentication',
    )
  }
}

// ── Standalone utilities ───────────────────────────────────────────────────────

/**
 * Checks whether biometric authentication is available on this device.
 * Does NOT require the hook — usable in non-component contexts (e.g. conditionally
 * rendering a biometric login button before any hook mounts).
 *
 * @throws If expo-local-authentication is not installed.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  const LocalAuth = requireLocalAuth()

  const [hasHardware, isEnrolled, supportedTypesRaw] = await Promise.all([
    LocalAuth.hasHardwareAsync(),
    LocalAuth.isEnrolledAsync(),
    LocalAuth.supportedAuthenticationTypesAsync(),
  ])

  const typeNames: Record<number, string> = {
    1: 'fingerprint',
    2: 'facial_recognition',
    3: 'iris',
  }
  const supportedTypes = supportedTypesRaw.map((t: number) => typeNames[t] ?? String(t))

  return {
    hasHardware,
    isEnrolled,
    isAvailable: hasHardware && isEnrolled,
    supportedTypes,
  }
}

/**
 * Triggers the native biometric authentication prompt.
 * Does NOT require the hook — usable anywhere async is allowed.
 *
 * @throws If expo-local-authentication is not installed.
 */
export async function promptBiometric(opts: BiometricPromptOptions = {}): Promise<BiometricAuthResult> {
  const LocalAuth = requireLocalAuth()
  const {
    promptMessage = 'Authenticate to continue',
    cancelLabel = 'Cancel',
    fallbackToPIN = true,
    fallbackLabel = 'Use Passcode',
    disableDeviceFallback = false,
  } = opts

  const result = await LocalAuth.authenticateAsync({
    promptMessage,
    cancelLabel,
    fallbackLabel,
    disableDeviceFallback: disableDeviceFallback || !fallbackToPIN,
  })

  return {
    success: result.success,
    error: result.success ? undefined : result.error,
    warning: result.warning,
  }
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

/**
 * Returns the biometric availability status for this device, refreshed on mount.
 *
 * @example
 * const { isAvailable, supportedTypes } = useBiometricAvailability()
 * if (isAvailable) return <BiometricButton />
 *
 * @throws If expo-local-authentication is not installed.
 */
export function useBiometricAvailability(): BiometricAvailability & { isLoading: boolean } {
  const [state, setState] = useState<BiometricAvailability>({
    hasHardware: false,
    isEnrolled: false,
    isAvailable: false,
    supportedTypes: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void checkBiometricAvailability()
      .then(setState)
      .finally(() => setIsLoading(false))
  }, [])

  return { ...state, isLoading }
}

/**
 * Returns an `authenticate` function that triggers the native biometric prompt.
 * Manages pending/error state internally so the caller doesn't have to.
 *
 * @example
 * const { authenticate, isPending, lastResult } = useBiometricAuth()
 *
 * <TouchableOpacity onPress={() => authenticate({ promptMessage: 'Unlock app' })}>
 *   <Text>Use Face ID</Text>
 * </TouchableOpacity>
 *
 * @throws If expo-local-authentication is not installed (thrown lazily on first call).
 */
export function useBiometricAuth() {
  const [isPending, setIsPending] = useState(false)
  const [lastResult, setLastResult] = useState<BiometricAuthResult | null>(null)

  const authenticate = useCallback(async (opts: BiometricPromptOptions = {}): Promise<BiometricAuthResult> => {
    setIsPending(true)
    try {
      const result = await promptBiometric(opts)
      setLastResult(result)
      return result
    } finally {
      setIsPending(false)
    }
  }, [])

  return { authenticate, isPending, lastResult }
}

/**
 * Hook that gates a callback behind biometric authentication.
 * The wrapped function will first prompt for biometrics, then call the original
 * callback only if authentication succeeds.
 *
 * @example
 * const deleteAccount = useBiometricGate(
 *   () => api.delete('/auth/me'),
 *   { promptMessage: 'Confirm account deletion' }
 * )
 *
 * <Button onPress={deleteAccount} title="Delete Account" />
 *
 * @throws If expo-local-authentication is not installed (thrown lazily on first call).
 */
export function useBiometricGate<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void | Promise<void>,
  opts: BiometricPromptOptions = {},
): (...args: TArgs) => Promise<void> {
  const callbackRef = useCallback(callback, []) // stable ref

  return useCallback(
    async (...args: TArgs): Promise<void> => {
      const result = await promptBiometric(opts)
      if (result.success) {
        await callbackRef(...args)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.promptMessage, opts.cancelLabel, opts.fallbackToPIN],
  )
}
