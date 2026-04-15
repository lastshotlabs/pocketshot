import React, { useCallback, useMemo, type ReactNode } from 'react'
import { ScrollView, RefreshControl } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { PullToRefreshConfig } from './types'

// ---------------------------------------------------------------------------
// PullToRefresh
// ---------------------------------------------------------------------------

export interface PullToRefreshProps {
  config: PullToRefreshConfig
  children?: ReactNode
}

/**
 * Pull-to-refresh wrapper. Wraps children in a ScrollView with RefreshControl.
 * Uses tokens for colors and dispatches the onRefresh action on pull.
 */
export function PullToRefresh({ config, children }: PullToRefreshProps) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()

  const refreshing = resolveFromRef<boolean>(
    config.refreshing as boolean | { from: string },
    values,
  ) ?? false

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const tintColor = typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.primary

  const handleRefresh = useCallback(async () => {
    await dispatch(config.onRefresh)
  }, [config.onRefresh, dispatch])

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={tintColor}
        colors={[tintColor]}
        progressBackgroundColor={tokens.colors.surface}
        testID={config.testID ? `${config.testID}-refresh` : `${config.id ?? 'pull-to-refresh'}-refresh`}
        accessibilityLabel="Pull to refresh"
      />
    ),
    [refreshing, handleRefresh, tintColor, tokens.colors.surface, config.testID, config.id],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollView
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        testID={config.testID ?? config.id ?? 'pull-to-refresh'}
      >
        {children}
      </ScrollView>
    </ComponentWrapper>
  )
}

