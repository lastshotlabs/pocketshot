import React from 'react'
import { View, Image as RNImage, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ImageConfig } from './types'

// Try to use expo-image for better caching, fall back to RN Image
let ExpoImage: typeof RNImage | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoImageModule = require('expo-image') as { Image: typeof RNImage }
  ExpoImage = expoImageModule.Image
} catch {
  // expo-image not installed, use RN Image
}

const ImageComponent = ExpoImage ?? RNImage

export function ConfigImage({ config }: { config: ImageConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const src = resolveFromRef(config.src, values) as string
  const styles = makeStyles(tokens, config)

  const imageProps = {
    source: { uri: src },
    accessibilityLabel: config.alt,
    resizeMode: config.resizeMode,
    style: styles.image,
    testID: config.testID ?? config.id,
  }

  // For 100% width with aspectRatio: use a View with alignSelf stretch
  if (config.width === '100%') {
    const content = (
      <View style={styles.stretchContainer}>
        <ImageComponent {...imageProps} style={styles.stretchImage} />
      </View>
    )

    if (config.onPress) {
      return (
        <ComponentWrapper id={config.id} testID={config.testID}>
          <TouchableOpacity
            onPress={() => void dispatch(config.onPress!)}
            accessibilityRole="imagebutton"
            accessibilityLabel={config.alt}
            activeOpacity={0.8}
          >
            {content}
          </TouchableOpacity>
        </ComponentWrapper>
      )
    }

    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        {content}
      </ComponentWrapper>
    )
  }

  const content = <ImageComponent {...imageProps} />

  if (config.onPress) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <TouchableOpacity
          onPress={() => void dispatch(config.onPress!)}
          accessibilityRole="imagebutton"
          accessibilityLabel={config.alt}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {content}
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: ImageConfig) {
  const borderRadius = tokens.radius[config.radius ?? 'none']
  const width = typeof config.width === 'number' ? config.width : undefined
  const height = config.height

  // Compute explicit height from aspectRatio if width is a number
  const computedHeight =
    height != null
      ? height
      : config.aspectRatio != null && width != null
        ? width / config.aspectRatio
        : 200 // fallback explicit height — rule 22 requires explicit dimensions

  return StyleSheet.create({
    image: {
      width: width ?? 200,
      height: computedHeight,
      borderRadius,
    },
    stretchContainer: {
      alignSelf: 'stretch',
      aspectRatio: config.aspectRatio ?? 16 / 9,
      borderRadius,
      overflow: 'hidden',
    },
    stretchImage: {
      width: undefined,
      height: undefined,
      flex: 1,
      borderRadius,
    },
  })
}
