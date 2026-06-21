import React, { useState, useCallback } from 'react'
import { ScrollView, RefreshControl, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

// Safe area insets — gracefully degrade if the package is not installed.
let useSafeAreaInsetsImpl:
  | (() => { bottom: number; top: number; left: number; right: number })
  | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const safeArea = require('react-native-safe-area-context') as {
    useSafeAreaInsets: () => { bottom: number; top: number; left: number; right: number }
  }
  useSafeAreaInsetsImpl = safeArea.useSafeAreaInsets
} catch {
  // react-native-safe-area-context not installed — insets default to 0
}

function useSafeBottom(): number {
  if (useSafeAreaInsetsImpl) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSafeAreaInsetsImpl().bottom
  }
  return 0
}

export interface ScrollContainerBaseProps {
  /** Scroll horizontally instead of vertically. */
  horizontal?: boolean
  /** Show the native scroll indicator. */
  showsScrollIndicator?: boolean
  /** Inner padding of the scroll content (token name or numeric pixels). */
  contentPadding?: string | number
  /** Enable pull-to-refresh. */
  refreshable?: boolean
  /** Async handler invoked when the user pulls to refresh. */
  onRefresh?: () => void | Promise<void>
  /** Style applied to the ScrollView root. */
  style?: ViewStyle
  /** Style applied to the inner content container. */
  contentContainerStyle?: ViewStyle
  /** Slot overrides (root, viewport). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
  children?: React.ReactNode
}

/**
 * Standalone ScrollContainer — plain React props, no manifest required.
 *
 * @example
 * <ScrollContainerBase refreshable onRefresh={refetch}>
 *   <Text>Content</Text>
 * </ScrollContainerBase>
 */
export function ScrollContainerBase({
  horizontal = false,
  showsScrollIndicator = false,
  contentPadding,
  refreshable = false,
  onRefresh,
  style,
  contentContainerStyle,
  slots,
  testID,
  id,
  children,
}: ScrollContainerBaseProps) {
  const tokens = useTokens()
  const safeBottom = useSafeBottom()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  const contentPaddingValue =
    contentPadding !== undefined
      ? typeof contentPadding === 'string'
        ? (tokens.spacing[contentPadding as unknown as keyof typeof tokens.spacing] ?? contentPadding)
        : contentPadding
      : undefined

  const rootSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.root,
  })
  const viewportSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexGrow: 1,
      paddingBottom: safeBottom,
      ...(contentPaddingValue !== undefined ? { padding: contentPaddingValue } : {}),
    },
    componentSurface: slots?.viewport,
  })

  return (
    <ScrollView
      style={[rootSurface.style as ViewStyle | undefined, style]}
      contentContainerStyle={[
        viewportSurface.style as ViewStyle | undefined,
        contentContainerStyle,
      ]}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={horizontal ? showsScrollIndicator : false}
      showsVerticalScrollIndicator={horizontal ? false : showsScrollIndicator}
      keyboardShouldPersistTaps="handled"
      testID={testID ?? id}
      refreshControl={
        refreshable ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  )
}
