import React, { useEffect, useRef } from 'react'
import { Animated, View, type DimensionValue, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type SkeletonVariant =
  | 'text'
  | 'avatar'
  | 'circular'
  | 'card'
  | 'list-item'
  | 'rectangular'
  | 'custom'

export interface SkeletonBaseProps {
  /** Visual variant. */
  variant?: SkeletonVariant
  /** Number of items to render (each is the chosen variant). */
  count?: number
  /** Number of text lines (text variant). */
  lines?: number
  /** Width (rectangular/custom variants). */
  width?: DimensionValue
  /** Height (rectangular/custom variants). */
  height?: DimensionValue
  /** Border radius (rectangular/custom variants). */
  borderRadius?: number
  /** Whether to animate shimmer. */
  animated?: boolean
  /** Slot overrides (line, shape, title, body). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

const SHIMMER_DURATION = 1200
const TEXT_LINE_HEIGHT = 12
const TEXT_LINE_GAP = 10
const AVATAR_SIZE = 48
const CARD_HEIGHT = 200
const LIST_ITEM_TEXT_HEIGHT = 10

const TEXT_LINE_WIDTHS: DimensionValue[] = ['100%', '85%', '65%', '90%', '70%', '80%']

function useShimmer(animated: boolean) {
  const translateX = useRef(new Animated.Value(-1)).current

  useEffect(() => {
    if (!animated) {
      translateX.stopAnimation()
      translateX.setValue(0)
      return
    }

    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: SHIMMER_DURATION,
        useNativeDriver: true,
      }),
    )
    anim.start()
    return () => anim.stop()
  }, [animated, translateX])

  return translateX
}

function ShimmerOverlay({
  shimmerAnim,
  width,
  animated,
}: {
  shimmerAnim: Animated.Value
  width: number
  animated: boolean
}) {
  if (!animated) return null

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  })

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
        { transform: [{ translateX }] },
      ]}
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

function SkeletonBox({
  width,
  height,
  borderRadius,
  tokens,
  shimmerAnim,
  animated,
  style,
}: {
  width: DimensionValue
  height: DimensionValue
  borderRadius: number
  tokens: DesignTokens
  shimmerAnim: Animated.Value
  animated: boolean
  style?: ViewStyle
}) {
  const numericWidth = typeof width === 'number' ? width : 300

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: tokens.colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <ShimmerOverlay shimmerAnim={shimmerAnim} width={numericWidth} animated={animated} />
    </View>
  )
}

function TextSkeleton({
  lines,
  tokens,
  shimmerAnim,
  animated,
  lineStyle,
}: {
  lines: number
  tokens: DesignTokens
  shimmerAnim: Animated.Value
  animated: boolean
  lineStyle?: ViewStyle
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
            animated={animated}
            style={lineStyle}
          />
        </View>
      ))}
    </View>
  )
}

function AvatarSkeleton({
  tokens,
  shimmerAnim,
  animated,
  shapeStyle,
}: {
  tokens: DesignTokens
  shimmerAnim: Animated.Value
  animated: boolean
  shapeStyle?: ViewStyle
}) {
  return (
    <SkeletonBox
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      borderRadius={AVATAR_SIZE / 2}
      tokens={tokens}
      shimmerAnim={shimmerAnim}
      animated={animated}
      style={shapeStyle}
    />
  )
}

function CardSkeleton({
  tokens,
  shimmerAnim,
  animated,
  shapeStyle,
  titleStyle,
  bodyStyle,
}: {
  tokens: DesignTokens
  shimmerAnim: Animated.Value
  animated: boolean
  shapeStyle?: ViewStyle
  titleStyle?: ViewStyle
  bodyStyle?: ViewStyle
}) {
  return (
    <View style={{ gap: tokens.spacing[3] }}>
      <SkeletonBox
        width="100%"
        height={CARD_HEIGHT}
        borderRadius={tokens.radius.lg}
        tokens={tokens}
        shimmerAnim={shimmerAnim}
        animated={animated}
        style={shapeStyle}
      />
      <SkeletonBox
        width="65%"
        height={TEXT_LINE_HEIGHT}
        borderRadius={tokens.radius.sm}
        tokens={tokens}
        shimmerAnim={shimmerAnim}
        animated={animated}
        style={titleStyle}
      />
      <SkeletonBox
        width="90%"
        height={TEXT_LINE_HEIGHT}
        borderRadius={tokens.radius.sm}
        tokens={tokens}
        shimmerAnim={shimmerAnim}
        animated={animated}
        style={bodyStyle}
      />
    </View>
  )
}

function ListItemSkeleton({
  tokens,
  shimmerAnim,
  animated,
  shapeStyle,
  titleStyle,
  bodyStyle,
}: {
  tokens: DesignTokens
  shimmerAnim: Animated.Value
  animated: boolean
  shapeStyle?: ViewStyle
  titleStyle?: ViewStyle
  bodyStyle?: ViewStyle
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[3] }}>
      <AvatarSkeleton
        tokens={tokens}
        shimmerAnim={shimmerAnim}
        animated={animated}
        shapeStyle={shapeStyle}
      />
      <View style={{ flex: 1, gap: tokens.spacing[2] }}>
        <SkeletonBox
          width="70%"
          height={LIST_ITEM_TEXT_HEIGHT}
          borderRadius={tokens.radius.sm}
          tokens={tokens}
          shimmerAnim={shimmerAnim}
          animated={animated}
          style={titleStyle}
        />
        <SkeletonBox
          width="45%"
          height={LIST_ITEM_TEXT_HEIGHT}
          borderRadius={tokens.radius.sm}
          tokens={tokens}
          shimmerAnim={shimmerAnim}
          animated={animated}
          style={bodyStyle}
        />
      </View>
    </View>
  )
}

/**
 * Standalone Skeleton — plain React props, no manifest required.
 *
 * @example
 * <SkeletonBase variant="text" lines={3} />
 */
export function SkeletonBase({
  variant = 'text',
  count = 1,
  lines = 3,
  width,
  height,
  borderRadius,
  animated = true,
  slots,
  style,
  testID,
}: SkeletonBaseProps) {
  const tokens = useTokens()
  const shimmerAnim = useShimmer(animated)

  const lineSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.line })
  const shapeSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.shape })
  const titleSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.title })
  const bodySurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.body })

  const containerStyle: ViewStyle = { width: '100%', ...style }

  const renderVariant = () => {
    switch (variant) {
      case 'text':
        return (
          <TextSkeleton
            lines={lines}
            tokens={tokens}
            shimmerAnim={shimmerAnim}
            animated={animated}
            lineStyle={lineSurface.style as ViewStyle | undefined}
          />
        )
      case 'avatar':
      case 'circular':
        return (
          <AvatarSkeleton
            tokens={tokens}
            shimmerAnim={shimmerAnim}
            animated={animated}
            shapeStyle={shapeSurface.style as ViewStyle | undefined}
          />
        )
      case 'card':
        return (
          <CardSkeleton
            tokens={tokens}
            shimmerAnim={shimmerAnim}
            animated={animated}
            shapeStyle={shapeSurface.style as ViewStyle | undefined}
            titleStyle={titleSurface.style as ViewStyle | undefined}
            bodyStyle={bodySurface.style as ViewStyle | undefined}
          />
        )
      case 'list-item':
        return (
          <ListItemSkeleton
            tokens={tokens}
            shimmerAnim={shimmerAnim}
            animated={animated}
            shapeStyle={shapeSurface.style as ViewStyle | undefined}
            titleStyle={titleSurface.style as ViewStyle | undefined}
            bodyStyle={bodySurface.style as ViewStyle | undefined}
          />
        )
      case 'rectangular':
      case 'custom':
        return (
          <SkeletonBox
            width={width ?? '100%'}
            height={height ?? 48}
            borderRadius={borderRadius ?? tokens.radius.md}
            tokens={tokens}
            shimmerAnim={shimmerAnim}
            animated={animated}
            style={shapeSurface.style as ViewStyle | undefined}
          />
        )
    }
  }

  return (
    <View
      style={containerStyle}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      importantForAccessibility="yes"
      testID={testID}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={i < count - 1 ? { marginBottom: tokens.spacing[4] } : undefined}>
          {renderVariant()}
        </View>
      ))}
    </View>
  )
}
