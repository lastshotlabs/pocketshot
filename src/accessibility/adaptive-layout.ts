export interface AdaptiveLayoutInput {
  width: number
  height: number
  fontScale: number
  topInset: number
  rightInset: number
  bottomInset: number
  leftInset: number
  keyboardHeight?: number
}

export interface AdaptiveLayoutSnapshot extends AdaptiveLayoutInput {
  orientation: 'portrait' | 'landscape'
  sizeClass: 'compact' | 'regular' | 'expanded'
  contentWidth: number
  contentHeight: number
  shouldReflowColumns: boolean
  keyboardVisible: boolean
}

export function resolveAdaptiveLayout(input: AdaptiveLayoutInput): AdaptiveLayoutSnapshot {
  for (const [key, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${key} must be non-negative`)
  }
  if (input.width === 0 || input.height === 0 || input.fontScale < 0.5 || input.fontScale > 3.2) {
    throw new Error('Viewport and font scale are invalid')
  }
  const keyboardHeight = Math.min(input.keyboardHeight ?? 0, input.height)
  const contentWidth = Math.max(0, input.width - input.leftInset - input.rightInset)
  const contentHeight = Math.max(
    0,
    input.height - input.topInset - Math.max(input.bottomInset, keyboardHeight),
  )
  const logicalWidth = contentWidth / input.fontScale
  return {
    ...input,
    keyboardHeight,
    orientation: input.width > input.height ? 'landscape' : 'portrait',
    sizeClass: logicalWidth < 600 ? 'compact' : logicalWidth < 840 ? 'regular' : 'expanded',
    contentWidth,
    contentHeight,
    shouldReflowColumns: logicalWidth < 600 || input.fontScale >= 2,
    keyboardVisible: keyboardHeight > 0,
  }
}
