import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, View, type DimensionValue, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, resolveSurfacePresentation, toNativeDimensionValue } from '../../_base'
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
  if (!animated) {
    return null
  }

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  })

  return (
    <Animated.View style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, { transform: [{ translateX }] }]}>
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

function CustomSkeleton({
  config,
  tokens,
  shimmerAnim,
  animated,
  shapeStyle,
}: {
  config: SkeletonConfig
  tokens: DesignTokens
  shimmerAnim: Animated.Value
  animated: boolean
  shapeStyle?: ViewStyle
}) {
  const frame = resolveCustomSkeletonFrame(tokens, config)

  return (
    <SkeletonBox
      width={frame.width}
      height={frame.height}
      borderRadius={frame.borderRadius}
      tokens={tokens}
      shimmerAnim={shimmerAnim}
      animated={animated}
      style={shapeStyle}
    />
  )
}

function renderVariant(
  variant: Variant,
  config: SkeletonConfig,
  tokens: DesignTokens,
  shimmerAnim: Animated.Value,
  animated: boolean,
  surfaces: {
    line?: ViewStyle
    shape?: ViewStyle
    title?: ViewStyle
    body?: ViewStyle
  },
) {
  switch (variant) {
    case 'text':
      return (
        <TextSkeleton
          lines={config.lines ?? 3}
          tokens={tokens}
          shimmerAnim={shimmerAnim}
          animated={animated}
          lineStyle={surfaces.line}
        />
      )
    case 'avatar':
    case 'circular':
      return (
        <AvatarSkeleton
          tokens={tokens}
          shimmerAnim={shimmerAnim}
          animated={animated}
          shapeStyle={surfaces.shape}
        />
      )
    case 'card':
      return (
        <CardSkeleton
          tokens={tokens}
          shimmerAnim={shimmerAnim}
          animated={animated}
          shapeStyle={surfaces.shape}
          titleStyle={surfaces.title}
          bodyStyle={surfaces.body}
        />
      )
    case 'list-item':
      return (
        <ListItemSkeleton
          tokens={tokens}
          shimmerAnim={shimmerAnim}
          animated={animated}
          shapeStyle={surfaces.shape}
          titleStyle={surfaces.title}
          bodyStyle={surfaces.body}
        />
      )
    case 'rectangular':
    case 'custom':
      return (
        <CustomSkeleton
          config={config}
          tokens={tokens}
          shimmerAnim={shimmerAnim}
          animated={animated}
          shapeStyle={surfaces.shape}
        />
      )
  }
}

export function Skeleton({ config }: { config: SkeletonConfig }) {
  const tokens = useTokens()
  const shimmerAnim = useShimmer(config.animated !== false)
  const variant = config.variant ?? 'text'
  const count = config.count ?? 1
  const lineSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.line as Record<string, unknown> | undefined,
  })
  const shapeSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.shape as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.body as Record<string, unknown> | undefined,
  })
  const styles = useMemo(
    () =>
      makeStyles(tokens, {
        itemGap: tokens.spacing[4],
      }),
    [tokens],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={styles.container}
        accessibilityLabel="Loading"
        accessibilityRole="progressbar"
        importantForAccessibility="yes"
      >
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={i < count - 1 ? styles.itemGap : undefined}>
            {renderVariant(variant, config, tokens, shimmerAnim, config.animated !== false, {
              line: lineSurface.style as ViewStyle | undefined,
              shape: shapeSurface.style as ViewStyle | undefined,
              title: titleSurface.style as ViewStyle | undefined,
              body: bodySurface.style as ViewStyle | undefined,
            })}
          </View>
        ))}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, values: { itemGap: number }) {
  return {
    container: {
      width: '100%',
    } satisfies ViewStyle,
    itemGap: {
      marginBottom: values.itemGap,
    } satisfies ViewStyle,
  }
}

function resolveCustomSkeletonFrame(tokens: DesignTokens, config: SkeletonConfig): {
  width: DimensionValue
  height: DimensionValue
  borderRadius: number
} {
  const resolvedStyle = resolveNativeStyleProps(
    {
      width: config.width,
      height: config.height,
      borderRadius: config.borderRadius,
    },
    tokens,
  )

  return {
    width: toNativeDimensionValue(resolvedStyle.width) ?? '100%',
    height: toNativeDimensionValue(resolvedStyle.height) ?? 48,
    borderRadius:
      typeof resolvedStyle.borderRadius === 'number' ? resolvedStyle.borderRadius : tokens.radius.md,
  }
}
