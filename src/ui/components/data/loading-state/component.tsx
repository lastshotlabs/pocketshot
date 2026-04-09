import React, { useEffect, useRef } from 'react'
import { ActivityIndicator, Animated, View, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { LoadingStateConfig } from './types'

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function SkeletonRows({
  count,
  height,
  tokens,
}: {
  count: number
  height: number
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

  const styles = makeSkeletonStyles(tokens, height)

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

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
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
        <SkeletonRows count={config.count} height={config.height} tokens={tokens} />
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

function makeSkeletonStyles(tokens: DesignTokens, height: number) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[2],
    },
    row: {
      height,
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.colors.surfaceAlt,
      marginBottom: tokens.spacing[3],
    },
  })
}
