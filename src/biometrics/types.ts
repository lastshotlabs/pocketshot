/** Result of a biometric authentication prompt. */
export interface BiometricAuthResult {
  /** Whether the user successfully authenticated. */
  success: boolean
  /** Error code from expo-local-authentication if authentication failed. */
  error?: string
  /** Human-readable warning from the OS if available. */
  warning?: string
}

/** Availability status of biometric hardware and enrollment. */
export interface BiometricAvailability {
  /** Whether the device has biometric hardware. */
  hasHardware: boolean
  /** Whether the user has enrolled biometrics on this device. */
  isEnrolled: boolean
  /** Whether biometric auth is fully available (hasHardware && isEnrolled). */
  isAvailable: boolean
  /** List of supported biometric types (e.g. ['fingerprint', 'facial_recognition']). */
  supportedTypes: string[]
}

/** Options for the biometric prompt. */
export interface BiometricPromptOptions {
  /** Prompt message shown to the user. Default: 'Authenticate to continue'. */
  promptMessage?: string
  /** Cancel button label. Default: 'Cancel'. */
  cancelLabel?: string
  /** Whether to fall back to device PIN/password if biometrics fail. Default: true. */
  fallbackToPIN?: boolean
  /** (iOS) Message shown on the fallback button. Default: 'Use Passcode'. */
  fallbackLabel?: string
  /** (iOS) Disable the fallback option entirely. Default: false. */
  disableDeviceFallback?: boolean
}
