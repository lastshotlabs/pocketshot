import React, { useEffect, useMemo, useRef } from 'react'
import { ActivityIndicator, Animated, View, StyleSheet, type DimensionValue } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, toNativeDimensionValue } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { LoadingStateConfig } from './types'

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function SkeletonRows({
  count,
  height,
  borderRadius,
  tokens,
}: {
  count: number
  height: DimensionValue
  borderRadius: number
  tokens: DesignTokens
}) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  const styles = makeSkeletonStyles(tokens, height, borderRadius)

  return (
    <View
      style={styles.container}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      importantForAccessibility="yes"
    >
      {Array.from({ length: count }, (_, i) => (
        <Animated.View key={i} style={[styles.row, { opacity }]} />
      ))}
    </View>
  )
}

// ---------------------------------------------------------------------------
// LoadingState
// ---------------------------------------------------------------------------

export function LoadingState({ config }: { config: LoadingStateConfig }) {
  const tokens = useTokens()
  const styles = makeContainerStyles(tokens)
  const skeletonFrame = useMemo(() => resolveLoadingSkeletonFrame(tokens, config), [config, tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {config.variant === 'spinner' ? (
        <View
          style={styles.spinnerContainer}
          accessibilityLabel="Loading"
          accessibilityRole="progressbar"
        >
          <ActivityIndicator
            size="large"
            color={tokens.colors.primary}
            accessibilityElementsHidden
          />
        </View>
      ) : (
        <SkeletonRows
          count={config.count ?? 3}
          height={skeletonFrame.height}
          borderRadius={skeletonFrame.borderRadius}
          tokens={tokens}
        />
      )}
    </ComponentWrapper>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeContainerStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    spinnerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.spacing[8],
    },
  })
}

function makeSkeletonStyles(tokens: DesignTokens, height: DimensionValue, borderRadius: number) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[2],
    },
    row: {
      height,
      borderRadius,
      backgroundColor: tokens.colors.surfaceAlt,
      marginBottom: tokens.spacing[3],
    },
  })
}

function resolveLoadingSkeletonFrame(tokens: DesignTokens, config: LoadingStateConfig): {
  height: DimensionValue
  borderRadius: number
} {
  const resolvedStyle = resolveNativeStyleProps(
    {
      height: config.height,
      borderRadius: config.borderRadius,
    },
    tokens,
  )

  return {
    height: toNativeDimensionValue(resolvedStyle.height) ?? 48,
    borderRadius:
      typeof resolvedStyle.borderRadius === 'number' ? resolvedStyle.borderRadius : tokens.radius.md,
  }
}

