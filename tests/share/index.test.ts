import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Inline mock factories (must not reference variables — vi.mock is hoisted) ──

vi.mock('react-native', () => ({
  Share: {
    share: vi.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}))

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  shareAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('expo-clipboard', () => ({
  getStringAsync: vi.fn().mockResolvedValue('clipboard text'),
  setStringAsync: vi.fn().mockResolvedValue(true),
  hasStringAsync: vi.fn().mockResolvedValue(true),
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useEffect: vi.fn(),
    useState: vi.fn((initial: unknown) => [initial, vi.fn()]),
    useCallback: (fn: unknown) => fn,
  }
})

import { Share } from 'react-native'
import * as ExpoSharing from 'expo-sharing'
import * as ExpoClipboard from 'expo-clipboard'
import {
  share,
  shareFile,
  getClipboardString,
  setClipboardString,
  hasClipboardString,
} from '../../src/share/index'

describe('share', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls RNShare.share with message content', async () => {
    vi.mocked(Share.share).mockResolvedValue({ action: 'sharedAction', activityType: undefined })
    const result = await share({ message: 'Check this out!' })
    expect(vi.mocked(Share.share)).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Check this out!' }),
      expect.any(Object),
    )
    expect(result.shared).toBe(true)
  })

  it('returns shared: true when action is sharedAction', async () => {
    vi.mocked(Share.share).mockResolvedValue({ action: 'sharedAction', activityType: 'com.apple.UIKit.activity.CopyToPasteboard' })
    const result = await share({ message: 'Hello' })
    expect(result.shared).toBe(true)
    expect(result.activityType).toBe('com.apple.UIKit.activity.CopyToPasteboard')
  })

  it('returns shared: false when action is dismissedAction', async () => {
    vi.mocked(Share.share).mockResolvedValue({ action: 'dismissedAction' })
    const result = await share({ message: 'Hello' })
    expect(result.shared).toBe(false)
  })

  it('returns shared: false on error (never throws)', async () => {
    vi.mocked(Share.share).mockRejectedValue(new Error('Share failed'))
    const result = await share({ message: 'Hello' })
    expect(result.shared).toBe(false)
  })

  it('passes url and title to RNShare', async () => {
    vi.mocked(Share.share).mockResolvedValue({ action: 'sharedAction' })
    await share({ message: 'Check this', url: 'https://example.com', title: 'Great post' })
    expect(vi.mocked(Share.share)).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com', title: 'Great post' }),
      expect.any(Object),
    )
  })
})

describe('shareFile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-sharing shareAsync with the file URI', async () => {
    await shareFile('file:///export.pdf', { mimeType: 'application/pdf', dialogTitle: 'Share PDF' })
    expect(vi.mocked(ExpoSharing.shareAsync)).toHaveBeenCalledWith(
      'file:///export.pdf',
      expect.objectContaining({ mimeType: 'application/pdf', dialogTitle: 'Share PDF' }),
    )
  })

  it('throws when sharing is not available', async () => {
    vi.mocked(ExpoSharing.isAvailableAsync).mockResolvedValueOnce(false)
    await expect(shareFile('file:///test.pdf')).rejects.toThrow('not available')
  })
})

describe('getClipboardString', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the clipboard content', async () => {
    vi.mocked(ExpoClipboard.getStringAsync).mockResolvedValue('clipboard text')
    const result = await getClipboardString()
    expect(result).toBe('clipboard text')
    expect(vi.mocked(ExpoClipboard.getStringAsync)).toHaveBeenCalledTimes(1)
  })
})

describe('setClipboardString', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes to the clipboard', async () => {
    await setClipboardString('new text')
    expect(vi.mocked(ExpoClipboard.setStringAsync)).toHaveBeenCalledWith('new text')
  })
})

describe('hasClipboardString', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when clipboard has a string', async () => {
    vi.mocked(ExpoClipboard.hasStringAsync).mockResolvedValue(true)
    const result = await hasClipboardString()
    expect(result).toBe(true)
  })

  it('returns false when clipboard is empty', async () => {
    vi.mocked(ExpoClipboard.hasStringAsync).mockResolvedValueOnce(false)
    const result = await hasClipboardString()
    expect(result).toBe(false)
  })
})
