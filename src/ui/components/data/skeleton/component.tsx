import React, { useEffect, useMemo, useRef } from 'react'
import { View, Animated, StyleSheet, type DimensionValue } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { SkeletonConfig } from './types'

type Variant = NonNullable<SkeletonConfig['variant']>

const SHIMMER_DURATION = 1200
const TEXT_LINE_HEIGHT = 12
const TEXT_LINE_GAP = 10
const AVATAR_SIZE = 48
const CARD_HEIGHT = 200
const LIST_ITEM_TEXT_HEIGHT = 10

/** Width percentages for text lines to look natural */
const TEXT_LINE_WIDTHS: DimensionValue[] = ['100%', '85%', '65%', '90%', '70%', '80%']

// ---------------------------------------------------------------------------
// Shimmer hook — shared animated translateX for all skeleton items
// ---------------------------------------------------------------------------

function useShimmer() {
  const translateX = useRef(new Animated.Value(-1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: SHIMMER_DURATION,
        useNativeDriver: true,
      }),
    )
    anim.start()
    return () => anim.stop()
  }, [translateX])

  return translateX
}

// ---------------------------------------------------------------------------
// ShimmerOverlay — renders the moving highlight band
// ---------------------------------------------------------------------------

function ShimmerOverlay({
  shimmerAnim,
  width,
}: {
  shimmerAnim: Animated.Value
  width: number
}) {
  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  })

  return (
    <Animated.View
      style={{
        ...StyleSheet.absoluteFillObject,
        transform: [{ translateX }],
      }}
    >
      <View
        style={{
          width: width * 0.4,
          height: '100%',
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: 4,
        }}
      />
    </Animated.View>
  )
}

// ---------------------------------------------------------------------------
// Individual skeleton shapes
// ---------------------------------------------------------------------------

function SkeletonBox({
  width,
  height,
  borderRadius,
  tokens,
  shimmerAnim,
}: {
  width: DimensionValue
  height: number
  borderRadius: number
  tokens: DesignTokens
  shimmerAnim: Animated.Value
}) {
  // We need a numeric width for the shimmer overlay. For percentage-based
  // widths we use a reasonable default so the shimmer still moves.
  const numericWidth = typeof width === 'number' ? width : 300

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: tokens.colors.border,
        overflow: 'hidden' as const,
      }}
    >
      <ShimmerOverlay shimmerAnim={shimmerAnim} width={numericWidth} />
    </View>
  )
}

function TextSkeleton({
  lines,
  tokens,
  shimmerAnim,
}: {
  lines: number
  tokens: DesignTokens
  shimmerAnim: Animated.Value
}) {
  return (
    <View>
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={{ marginBottom: i < lines - 1 ? TEXT_LINE_GAP : 0 }}>
          <SkeletonBox
            width={TEXT_LINE_WIDTHS[i % TEXT_LINE_WIDTHS.length]}
            height={TEXT_LINE_HEIGHT}
            borderRadius={tokens.radius.sm}
            tokens={tokens}
            shimmerAnim={shimmerAnim}
          />
        </View>
      ))}
    </View>
  )
}

function AvatarSkeleton({
  tokens,
  shimmerAnim,
}: {
  tokens: DesignTokens
  shimmerAnim: Animated.Value
}) {
  return (
    <SkeletonBox
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      tokens={tokens}
      shimmerAnim={shimmerAnim}
    />
  )
}

function CardSkeleton({
  tokens,
  shimmerAnim,
}: {
  tokens: DesignTokens
  shimmerAnim: Animated.Value
}) {
  return (
    <View style={{ gap: tokens.spacing[3] }}>
      <SkeletonBox
        width="100%"
        height={CARD_HEIGHT}
        borderRadius={tokens.radius.lg}
        tokens={tokens}
        shimmerAnim={shimmerAnim}
      />
      <TextSkeleton lines={2} tokens={tokens} shimmerAnim={shimmerAnim} />
    </View>
  )
}

function ListItemSkeleton({
  tokens,
  shimmerAnim,
}: {
  tokens: DesignTokens
  shimmerAnim: Animated.Value
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[3] }}>
      <AvatarSkeleton tokens={tokens} shimmerAnim={shimmerAnim} />
      <View style={{ flex: 1, gap: tokens.spacing[2] }}>
        <SkeletonBox
          width="70%"
          height={LIST_ITEM_TEXT_HEIGHT}
          borderRadius={tokens.radius.sm}
          tokens={tokens}
          shimmerAnim={shimmerAnim}
        />
        <SkeletonBox
          width="45%"
          height={LIST_ITEM_TEXT_HEIGHT}
          borderRadius={tokens.radius.sm}
          tokens={tokens}
          shimmerAnim={shimmerAnim}
        />
      </View>
    </View>
  )
}

function CustomSkeleton({
  config,
  tokens,
  shimmerAnim,
}: {
  config: SkeletonConfig
  tokens: DesignTokens
  shimmerAnim: Animated.Value
}) {
  return (
    <SkeletonBox
      width={(config.width ?? '100%') as DimensionValue}
      height={config.height ?? 48}
      borderRadius={config.borderRadius ?? tokens.radius.md}
      tokens={tokens}
      shimmerAnim={shimmerAnim}
    />
  )
}

// ---------------------------------------------------------------------------
// Main Skeleton component
// ---------------------------------------------------------------------------

function renderVariant(
  variant: Variant,
  config: SkeletonConfig,
  tokens: DesignTokens,
  shimmerAnim: Animated.Value,
) {
  switch (variant) {
    case 'text':
      return <TextSkeleton lines={config.lines ?? 3} tokens={tokens} shimmerAnim={shimmerAnim} />
    case 'avatar':
      return <AvatarSkeleton tokens={tokens} shimmerAnim={shimmerAnim} />
    case 'card':
      return <CardSkeleton tokens={tokens} shimmerAnim={shimmerAnim} />
    case 'list-item':
      return <ListItemSkeleton tokens={tokens} shimmerAnim={shimmerAnim} />
    case 'custom':
      return <CustomSkeleton config={config} tokens={tokens} shimmerAnim={shimmerAnim} />
  }
}

export function Skeleton({ config }: { config: SkeletonConfig }) {
  const tokens = useTokens()
  const shimmerAnim = useShimmer()
  const variant = config.variant ?? 'text'
  const count = config.count ?? 1
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View
        style={styles.container}
        accessibilityLabel="Loading"
        accessibilityRole="progressbar"
        importantForAccessibility="yes"
      >
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={i < count - 1 ? styles.itemGap : undefined}>
            {renderVariant(variant, config, tokens, shimmerAnim)}
          </View>
        ))}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    itemGap: {
      marginBottom: tokens.spacing[4],
    },
  })
}
