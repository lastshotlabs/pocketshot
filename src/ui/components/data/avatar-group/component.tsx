import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { Avatar } from '../avatar/component'
import type { AvatarGroupConfig, AvatarGroupItem } from './types'

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56 } as const

export function AvatarGroup({ config }: { config: AvatarGroupConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()

  const resolvedAvatars: AvatarGroupItem[] = isFromRef(config.avatars)
    ? ((resolveFromRef(
        config.avatars as { from: string },
        values,
      ) as unknown as AvatarGroupItem[]) ?? [])
    : (config.avatars as unknown as AvatarGroupItem[])

  const size = config.size ?? 'sm'
  const pixelSize = SIZE_MAP[size]
  const overlap = config.overlap ?? 8
  const visible = resolvedAvatars.slice(0, config.maxVisible ?? 4)
  const overflowCount = Math.max(0, resolvedAvatars.length - (config.maxVisible ?? 4))
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const rootSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const itemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.item as Record<string, unknown> | undefined,
  })
  const initialsSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.initials as Record<string, unknown> | undefined,
  })
  const imageSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.image as Record<string, unknown> | undefined,
  })
  const overflowSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.overflow as Record<string, unknown> | undefined,
  })

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const groupLabel = `${resolvedAvatars.length} members`
  const rowWidth =
    pixelSize + (visible.length - 1 + (overflowCount > 0 ? 1 : 0)) * (pixelSize - overlap)

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    height: pixelSize,
    position: 'relative',
    width: rowWidth,
  }
  const itemStyle: ViewStyle = {
    position: 'absolute',
    borderWidth: 2,
    borderColor: tokens.colors.background,
    borderRadius: pixelSize / 2,
  }
  const overflowBadgeStyle: ViewStyle = {
    position: 'absolute',
    width: pixelSize,
    height: pixelSize,
    borderRadius: pixelSize / 2,
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: 2,
    borderColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  }
  const overflowTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : Math.round(pixelSize * 0.32),
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.textMuted,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
  }

  const inner = (
    <View
      style={[rowStyle, rootSurface.style as ViewStyle | undefined]}
      accessibilityLabel={groupLabel}
    >
      {visible.map((item, index) => (
        <View
          key={index}
          style={[
            itemStyle,
            { left: index * (pixelSize - overlap) },
            itemSurface.style as ViewStyle | undefined,
          ]}
        >
          <Avatar
            config={{
              src: item.src,
              name: item.name,
              size,
              shape: 'circle',
              slots: {
                image: config.slots?.image,
                initials: config.slots?.initials,
              },
            }}
          />
        </View>
      ))}
      {overflowCount > 0 ? (
        <View
          style={[
            overflowBadgeStyle,
            { left: visible.length * (pixelSize - overlap) },
            overflowSurface.style as ViewStyle | undefined,
          ]}
        >
          <Text style={[overflowTextStyle, initialsSurface.style as TextStyle | undefined]}>
            +{overflowCount}
          </Text>
        </View>
      ) : null}
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {config.onPress ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={groupLabel}
          accessibilityHint="Tap to view all members"
        >
          {inner}
        </TouchableOpacity>
      ) : (
        inner
      )}
    </ComponentWrapper>
  )
}
