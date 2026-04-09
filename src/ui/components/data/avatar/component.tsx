import React, { useCallback, useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { AvatarConfig } from './types'

// ---------------------------------------------------------------------------
// Size map: xs=24, sm=32, md=40, lg=56, xl=72
// ---------------------------------------------------------------------------

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
} as const

// ---------------------------------------------------------------------------
// Initials background color — deterministic from name string
// ---------------------------------------------------------------------------

const INITIALS_PALETTE = [
  '#E57373', '#F06292', '#BA68C8', '#7986CB', '#4FC3F7',
  '#4DB6AC', '#81C784', '#FFD54F', '#FF8A65', '#A1887F',
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

// ---------------------------------------------------------------------------
// Try to load expo-image; fall back to RN Image
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Avatar image sub-component
// ---------------------------------------------------------------------------

function AvatarImage({
  src,
  size,
  borderRadius,
  name,
  onError,
}: {
  src: string
  size: number
  borderRadius: number
  name: string
  onError: () => void
}) {
  const imageStyle = { width: size, height: size, borderRadius }

  if (ExpoImage) {
    return (
      <ExpoImage
        source={{ uri: src }}
        style={imageStyle}
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

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export function Avatar({ config }: { config: AvatarConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const [imgError, setImgError] = useState(false)

  const resolvedSrc = config.src
    ? isFromRef(config.src)
      ? String(resolveFromRef(config.src, values) ?? '')
      : config.src
    : undefined

  const resolvedName = config.name
    ? isFromRef(config.name)
      ? String(resolveFromRef(config.name, values) ?? '')
      : config.name
    : undefined

  const size = SIZE_MAP[config.size]
  const borderRadius =
    config.shape === 'circle'
      ? size / 2
      : config.shape === 'rounded'
        ? tokens.radius.lg
        : tokens.radius.none

  const showImage = !!resolvedSrc && !imgError
  const initials = resolvedName ? getInitials(resolvedName) : '?'
  const initialsBackground = resolvedName ? pickInitialsColor(resolvedName) : tokens.colors.surfaceAlt

  const styles = makeStyles(tokens, size, borderRadius, initialsBackground)

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const content = (
    <View
      style={styles.container}
      accessibilityLabel={resolvedName ? `${resolvedName} avatar` : 'Avatar'}
    >
      {showImage ? (
        <AvatarImage
          src={resolvedSrc}
          size={size}
          borderRadius={borderRadius}
          name={resolvedName ?? ''}
          onError={() => setImgError(true)}
        />
      ) : (
        <Text style={styles.initials} accessibilityElementsHidden>
          {initials}
        </Text>
      )}
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {config.onPress ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={resolvedName ? `${resolvedName} avatar` : 'Avatar'}
          accessibilityHint="Tap to view profile"
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </ComponentWrapper>
  )
}

function makeStyles(
  tokens: DesignTokens,
  size: number,
  borderRadius: number,
  initialsBackground: string,
) {
  const fontSize = Math.round(size * 0.38)
  return StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius,
      backgroundColor: initialsBackground,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    initials: {
      fontSize,
      color: tokens.colors.textInverse,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
  })
}
