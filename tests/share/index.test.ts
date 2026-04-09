import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures these refs exist when vi.mock factories run (factories are hoisted)
const rnShareMocks = vi.hoisted(() => ({
  share: vi.fn(),
  sharedAction: 'sharedAction',
  dismissedAction: 'dismissedAction',
}))

const expoSharingMocks = vi.hoisted(() => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  shareAsync: vi.fn().mockResolvedValue(undefined),
}))

const expoClipboardMocks = vi.hoisted(() => ({
  getStringAsync: vi.fn().mockResolvedValue('clipboard text'),
  setStringAsync: vi.fn().mockResolvedValue(true),
  hasStringAsync: vi.fn().mockResolvedValue(true),
}))

vi.mock('react-native', () => ({ Share: rnShareMocks }))
vi.mock('expo-sharing', () => expoSharingMocks)
vi.mock('expo-clipboard', () => expoClipboardMocks)
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useEffect: vi.fn(),
    useState: vi.fn((initial: unknown) => [initial, vi.fn()]),
    useCallback: (fn: unknown) => fn,
  }
})

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
    rnShareMocks.share.mockResolvedValue({ action: 'sharedAction', activityType: undefined })
    const result = await share({ message: 'Check this out!' })
    expect(rnShareMocks.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Check this out!' }),
      expect.any(Object),
    )
    expect(result.shared).toBe(true)
  })

  it('returns shared: true when action is sharedAction', async () => {
    rnShareMocks.share.mockResolvedValue({ action: 'sharedAction', activityType: 'com.apple.UIKit.activity.CopyToPasteboard' })
    const result = await share({ message: 'Hello' })
    expect(result.shared).toBe(true)
    expect(result.activityType).toBe('com.apple.UIKit.activity.CopyToPasteboard')
  })

  it('returns shared: false when action is dismissedAction', async () => {
    rnShareMocks.share.mockResolvedValue({ action: 'dismissedAction' })
    const result = await share({ message: 'Hello' })
    expect(result.shared).toBe(false)
  })

  it('returns shared: false on error (never throws)', async () => {
    rnShareMocks.share.mockRejectedValue(new Error('Share failed'))
    const result = await share({ message: 'Hello' })
    expect(result.shared).toBe(false)
  })

  it('passes url and title to RNShare', async () => {
    rnShareMocks.share.mockResolvedValue({ action: 'sharedAction' })
    await share({ message: 'Check this', url: 'https://example.com', title: 'Great post' })
    expect(rnShareMocks.share).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com', title: 'Great post' }),
      expect.any(Object),
    )
  })
})

describe('shareFile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls expo-sharing shareAsync with the file URI', async () => {
    await shareFile('file:///export.pdf', { mimeType: 'application/pdf', dialogTitle: 'Share PDF' })
    expect(expoSharingMocks.shareAsync).toHaveBeenCalledWith(
      'file:///export.pdf',
      expect.objectContaining({ mimeType: 'application/pdf', dialogTitle: 'Share PDF' }),
    )
  })

  it('throws when sharing is not available', async () => {
    expoSharingMocks.isAvailableAsync.mockResolvedValueOnce(false)
    await expect(shareFile('file:///test.pdf')).rejects.toThrow('not available')
  })
})

describe('getClipboardString', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the clipboard content', async () => {
    expoClipboardMocks.getStringAsync.mockResolvedValue('clipboard text')
    const result = await getClipboardString()
    expect(result).toBe('clipboard text')
    expect(expoClipboardMocks.getStringAsync).toHaveBeenCalledTimes(1)
  })
})

describe('setClipboardString', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes to the clipboard', async () => {
    await setClipboardString('new text')
    expect(expoClipboardMocks.setStringAsync).toHaveBeenCalledWith('new text')
  })
})

describe('hasClipboardString', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when clipboard has a string', async () => {
    expoClipboardMocks.hasStringAsync.mockResolvedValue(true)
    const result = await hasClipboardString()
    expect(result).toBe(true)
  })

  it('returns false when clipboard is empty', async () => {
    expoClipboardMocks.hasStringAsync.mockResolvedValueOnce(false)
    const result = await hasClipboardString()
    expect(result).toBe(false)
  })
})
