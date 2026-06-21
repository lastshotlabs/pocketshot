import React, { useMemo, type ReactNode } from 'react'
import { RefreshControl, ScrollView, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface PullToRefreshBaseProps {
  /** Whether a refresh is currently in progress. */
  refreshing: boolean
  /** Called when the user pulls to refresh. */
  onRefresh: () => void | Promise<void>
  /** Override tint color. */
  tintColor?: string
  /** Slot overrides (scrollView). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
  children?: ReactNode
}

/**
 * Standalone PullToRefresh — wraps children in a ScrollView with RefreshControl.
 *
 * @example
 * <PullToRefreshBase refreshing={loading} onRefresh={fetchData}>
 *   <MyContent />
 * </PullToRefreshBase>
 */
export function PullToRefreshBase({
  refreshing,
  onRefresh,
  tintColor,
  slots,
  style,
  testID,
  id,
  children,
}: PullToRefreshBaseProps) {
  const tokens = useTokens()

  const resolvedTint = tintColor ?? tokens.colors.primary
  const scrollViewSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { minHeight: '100%' },
    componentSurface: slots?.scrollView,
  })
  const baseTestID = testID ?? id ?? 'pull-to-refresh'

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={resolvedTint}
        colors={[resolvedTint]}
        progressBackgroundColor={tokens.colors.surface}
        testID={`${baseTestID}-refresh`}
        accessibilityLabel="Pull to refresh"
      />
    ),
    [baseTestID, refreshing, onRefresh, resolvedTint, tokens.colors.surface],
  )

  return (
    <ScrollView
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      style={[scrollViewSurface.style as ViewStyle | undefined, style]}
      testID={`${baseTestID}-scroll`}
    >
      {children}
    </ScrollView>
  )
}
