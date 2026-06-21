import React from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import { AvatarBase, type AvatarSize } from '../avatar/standalone'

export type AvatarGroupSize = Extract<AvatarSize, 'xs' | 'sm' | 'md' | 'lg'>

export interface AvatarGroupItem {
  src?: string
  name?: string
}

export interface AvatarGroupBaseProps {
  /** Avatars to render in the group. */
  avatars: AvatarGroupItem[]
  /** Avatar size. */
  size?: AvatarGroupSize
  /** Pixel overlap between adjacent avatars. */
  overlap?: number
  /** Maximum visible avatars before showing the +N badge. */
  maxVisible?: number
  /** Press handler for the entire group. */
  onPress?: () => void
  /** Slot overrides (root, item, image, initials, overflow). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

const SIZE_MAP: Record<AvatarGroupSize, number> = { xs: 24, sm: 32, md: 40, lg: 56 }

/**
 * Standalone AvatarGroup — plain React props, no manifest required.
 *
 * @example
 * <AvatarGroupBase avatars={[{ name: 'Ada' }, { name: 'Grace' }]} size="sm" />
 */
export function AvatarGroupBase({
  avatars,
  size = 'sm',
  overlap = 8,
  maxVisible = 4,
  onPress,
  slots,
  style,
  testID,
}: AvatarGroupBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const pixelSize = SIZE_MAP[size]
  const visible = avatars.slice(0, maxVisible)
  const overflowCount = Math.max(0, avatars.length - maxVisible)

  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const itemSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.item })
  const initialsSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.initials })
  const overflowSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.overflow })

  const groupLabel = `${avatars.length} members`
  const rowWidth =
    pixelSize + (visible.length - 1 + (overflowCount > 0 ? 1 : 0)) * (pixelSize - overlap)

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    height: pixelSize,
    position: 'relative',
    width: rowWidth,
    ...style,
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
    ...sharedTextStyle,
    fontSize: Math.round(pixelSize * 0.32),
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeightSemibold,
  }

  const inner = (
    <View
      style={[rowStyle, rootSurface.style as ViewStyle | undefined]}
      accessibilityLabel={groupLabel}
      testID={testID}
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
          <AvatarBase
            src={item.src}
            name={item.name}
            size={size}
            shape="circle"
            slots={{
              ...(slots?.image ? { image: slots.image } : {}),
              ...(slots?.initials ? { initials: slots.initials } : {}),
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

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={groupLabel}
        accessibilityHint="Tap to view all members"
      >
        {inner}
      </TouchableOpacity>
    )
  }
  return inner
}
