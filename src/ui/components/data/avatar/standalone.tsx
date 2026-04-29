import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  type GestureResponderEvent,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarShape = 'circle' | 'rounded' | 'square'

export interface AvatarBaseProps {
  src?: string
  name?: string
  size?: AvatarSize
  shape?: AvatarShape
  onPress?: (event: GestureResponderEvent) => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
}

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 } as const

const INITIALS_PALETTE = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#7986CB',
  '#4FC3F7',
  '#4DB6AC',
  '#81C784',
  '#FFD54F',
  '#FF8A65',
  '#A1887F',
]

function pickInitialsColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return INITIALS_PALETTE[hash % INITIALS_PALETTE.length]
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 0) return '?'
  if (words.length === 1) return (words[0][0] ?? '?').toUpperCase()
  return ((words[0][0] ?? '') + (words[words.length - 1][0] ?? '')).toUpperCase()
}

let ExpoImage: React.ComponentType<{
  source: { uri: string }
  style: object
  contentFit?: string
  accessibilityLabel?: string
  onError?: () => void
}> | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoImage = (require('expo-image') as { Image: typeof ExpoImage }).Image
} catch {
  ExpoImage = null
}

function AvatarImage({
  src,
  size,
  borderRadius,
  name,
  onError,
  style,
}: {
  src: string
  size: number
  borderRadius: number
  name: string
  onError: () => void
  style?: ImageStyle
}) {
  const imageStyle = [{ width: size, height: size, borderRadius }, style].filter(
    Boolean,
  ) as ImageStyle[]

  if (ExpoImage) {
    return (
      <ExpoImage
        source={{ uri: src }}
        style={imageStyle as object}
        contentFit="cover"
        accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
        onError={onError}
      />
    )
  }

  return (
    <Image
      source={{ uri: src }}
      style={imageStyle}
      resizeMode="cover"
      accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
      onError={onError}
    />
  )
}

/**
 * Standalone Avatar — plain React props, no manifest required.
 *
 * @example
 * <AvatarBase src="https://…/me.jpg" name="Jane Doe" size="md" />
 */
export function AvatarBase({
  src,
  name,
  size = 'md',
  shape = 'circle',
  onPress,
  style,
  slots,
  testID,
}: AvatarBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [imgError, setImgError] = useState(false)

  const resolvedSize = SIZE_MAP[size]
  const borderRadius =
    shape === 'circle'
      ? resolvedSize / 2
      : shape === 'rounded'
        ? tokens.radius.lg
        : tokens.radius.none

  const showImage = !!src && !imgError
  const initials = name ? getInitials(name) : '?'
  const initialsBackground = name ? pickInitialsColor(name) : tokens.colors.surfaceAlt

  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const imageSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.image })
  const initialsSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.initials })
  const fallbackSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.fallback })

  const containerStyle: ViewStyle = {
    width: resolvedSize,
    height: resolvedSize,
    borderRadius,
    backgroundColor: initialsBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...style,
  }
  const initialsStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: Math.round(resolvedSize * 0.38),
    color: tokens.colors.textInverse,
    fontWeight: tokens.typography.fontWeightSemibold,
  }

  const content = (
    <View
      style={[
        containerStyle,
        rootSurface.style as ViewStyle | undefined,
        !showImage ? (fallbackSurface.style as ViewStyle | undefined) : undefined,
      ]}
      accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
      testID={testID}
    >
      {showImage && src ? (
        <AvatarImage
          src={src}
          size={resolvedSize}
          borderRadius={borderRadius}
          name={name ?? ''}
          onError={() => setImgError(true)}
          style={imageSurface.style as ImageStyle | undefined}
        />
      ) : (
        <Text
          style={[initialsStyle, initialsSurface.style as TextStyle | undefined]}
          accessibilityElementsHidden
        >
          {initials}
        </Text>
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
        accessibilityHint="Tap to view profile"
      >
        {content}
      </TouchableOpacity>
    )
  }
  return content
}
