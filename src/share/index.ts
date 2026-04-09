import { useCallback, useEffect, useState } from 'react'
import { Share as RNShare } from 'react-native'
import type {
  ShareContent,
  ShareOptions,
  ShareResult,
  ClipboardWriteOptions,
} from './types'

export type { ShareContent, ShareOptions, ShareResult, ClipboardWriteOptions } from './types'

// ── Optional peer dep loaders ─────────────────────────────────────────────────

function tryLoadSharing() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sharing') as {
      isAvailableAsync(): Promise<boolean>
      shareAsync(url: string, opts?: { mimeType?: string; dialogTitle?: string; UTI?: string }): Promise<void>
    }
  } catch {
    return null
  }
}

function requireClipboard() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-clipboard') as {
      getStringAsync(): Promise<string>
      setStringAsync(text: string, opts?: { inputInSeconds?: number }): Promise<boolean>
      hasStringAsync(): Promise<boolean>
      addClipboardListener(cb: (e: { contentTypes: string[] }) => void): { remove(): void }
    }
  } catch {
    throw new Error(
      '[pocketshot] Clipboard requires expo-clipboard.\nInstall it: npx expo install expo-clipboard',
    )
  }
}

// ── Share sheet ───────────────────────────────────────────────────────────────

/**
 * Opens the native share sheet with the given content.
 *
 * Uses React Native's built-in `Share` API (no extra dep needed for basic sharing).
 * Falls back to `expo-sharing` for file sharing (sharing a local file URI).
 *
 * @returns ShareResult indicating whether the user completed the share.
 *
 * @example
 * await share({ message: 'Check this out!', url: 'https://example.com/post/123' })
 */
export async function share(content: ShareContent, options: ShareOptions = {}): Promise<ShareResult> {
  try {
    // RNShare content type requires `message: string` but accepts url alone on iOS.
    // We cast to satisfy TS while preserving the correct runtime shape.
    const shareContent = {
      message: content.message,
      url: content.url,
      title: content.title,
    } as unknown as Parameters<typeof RNShare.share>[0]
    const result = await RNShare.share(
      shareContent,
      {
        excludedActivityTypes: options.excludedActivityTypes,
        dialogTitle: options.dialogTitle,
      },
    )

    if (result.action === RNShare.sharedAction) {
      return {
        shared: true,
        activityType: result.activityType ?? undefined,
      }
    }
    return { shared: false }
  } catch {
    return { shared: false }
  }
}

/**
 * Shares a local file URI using expo-sharing.
 * Useful for sharing exported PDFs, images, or other file artifacts.
 *
 * @throws If expo-sharing is not installed and sharing is not available.
 *
 * @example
 * await shareFile('file:///path/to/export.pdf', { mimeType: 'application/pdf' })
 */
export async function shareFile(
  fileUri: string,
  opts: { mimeType?: string; dialogTitle?: string } = {},
): Promise<void> {
  const Sharing = tryLoadSharing()
  if (!Sharing) {
    throw new Error(
      '[pocketshot] File sharing requires expo-sharing.\nInstall it: npx expo install expo-sharing',
    )
  }
  const available = await Sharing.isAvailableAsync()
  if (!available) {
    throw new Error('[pocketshot] Share sheet is not available on this device.')
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: opts.mimeType,
    dialogTitle: opts.dialogTitle,
    UTI: opts.mimeType,
  })
}

// ── Clipboard ─────────────────────────────────────────────────────────────────

/**
 * Reads the current clipboard string value.
 * @throws If expo-clipboard is not installed.
 */
export async function getClipboardString(): Promise<string> {
  return requireClipboard().getStringAsync()
}

/**
 * Writes a string to the clipboard.
 * @throws If expo-clipboard is not installed.
 */
export async function setClipboardString(text: string, _opts: ClipboardWriteOptions = {}): Promise<void> {
  const Clipboard = requireClipboard()
  // expo-clipboard setStringAsync returns boolean (true = success)
  await Clipboard.setStringAsync(text)
}

/**
 * Returns true if the clipboard has a string value.
 * @throws If expo-clipboard is not installed.
 */
export async function hasClipboardString(): Promise<boolean> {
  return requireClipboard().hasStringAsync()
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

/**
 * Hook that provides a `shareContent` function with `isPending` state tracking.
 *
 * @example
 * const { shareContent, isPending } = useShare()
 * <Button onPress={() => shareContent({ url: post.url, message: post.title })} />
 */
export function useShare() {
  const [isPending, setIsPending] = useState(false)
  const [lastResult, setLastResult] = useState<ShareResult | null>(null)

  const shareContent = useCallback(async (content: ShareContent, opts?: ShareOptions): Promise<ShareResult> => {
    setIsPending(true)
    try {
      const result = await share(content, opts)
      setLastResult(result)
      return result
    } finally {
      setIsPending(false)
    }
  }, [])

  const shareFileContent = useCallback(async (
    fileUri: string,
    opts?: { mimeType?: string; dialogTitle?: string },
  ): Promise<void> => {
    setIsPending(true)
    try {
      await shareFile(fileUri, opts)
    } finally {
      setIsPending(false)
    }
  }, [])

  return { shareContent, shareFileContent, isPending, lastResult }
}

/**
 * Hook for clipboard read/write with change subscription.
 * Subscribes to clipboard change events when expo-clipboard is available.
 *
 * @throws If expo-clipboard is not installed (thrown lazily on first read/write call).
 *
 * @example
 * const { value, copy, paste, hasCopied } = useClipboard()
 */
export function useClipboard() {
  const [value, setValue] = useState<string>('')
  const [hasCopied, setHasCopied] = useState(false)

  // Subscribe to clipboard changes (expo-clipboard 5+)
  useEffect(() => {
    let Clipboard: ReturnType<typeof requireClipboard>
    try {
      Clipboard = requireClipboard()
    } catch {
      return  // graceful no-op if not installed
    }

    // Load initial value
    void Clipboard.getStringAsync().then(setValue)

    // Subscribe to changes
    const sub = Clipboard.addClipboardListener(() => {
      void Clipboard.getStringAsync().then(setValue)
    })
    return () => sub.remove()
  }, [])

  const copy = useCallback(async (text: string, opts?: ClipboardWriteOptions): Promise<void> => {
    await setClipboardString(text, opts)
    setValue(text)
    setHasCopied(true)
    // Reset hasCopied after 2s
    setTimeout(() => setHasCopied(false), 2000)
  }, [])

  const paste = useCallback(async (): Promise<string> => {
    const text = await getClipboardString()
    setValue(text)
    return text
  }, [])

  return { value, copy, paste, hasCopied }
}
