import React from 'react'
import { Image as RNImage, TouchableOpacity, type ImageStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, resolveSurfacePresentation, toNativeDimensionValue } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { ImageConfig } from './types'

let ExpoImage: typeof RNImage | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoImageModule = require('expo-image') as { Image: typeof RNImage }
  ExpoImage = expoImageModule.Image
} catch {
  ExpoImage = null
}

const ImageComponent = ExpoImage ?? RNImage

export function ConfigImage({ config }: { config: ImageConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const src = resolveFromRef(config.src, values) as string
  const resolvedStyle = resolveNativeStyleProps(
    {
      width: config.width,
      height: config.height,
      borderRadius: config.borderRadius,
    },
    tokens,
  )
  const width = toNativeDimensionValue(resolvedStyle.width)
  const height = toNativeDimensionValue(resolvedStyle.height)
  const borderRadius =
    typeof resolvedStyle.borderRadius === 'number' ? resolvedStyle.borderRadius : undefined

  const computedHeight =
    height != null
      ? height
      : config.aspectRatio != null && typeof width === 'number'
        ? width / config.aspectRatio
        : undefined

  const imageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: width ?? 200,
      height: computedHeight ?? 200,
      ...(config.aspectRatio != null && height == null && typeof width !== 'number'
        ? { aspectRatio: config.aspectRatio }
        : undefined),
      ...(borderRadius != null ? { borderRadius } : undefined),
    },
    componentSurface: config.slots?.image as Record<string, unknown> | undefined,
  })
  const pressableSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {},
    componentSurface: config.slots?.pressable as Record<string, unknown> | undefined,
  })

  const content = (
    <ImageComponent
      source={{ uri: src }}
      accessibilityLabel={config.alt}
      resizeMode={config.resizeMode}
      style={imageSurface.style as ImageStyle | undefined}
      testID={config.testID ?? config.id}
    />
  )

  if (config.onPress) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <TouchableOpacity
          onPress={() => void dispatch(config.onPress!)}
          accessibilityRole="imagebutton"
          accessibilityLabel={config.alt}
          activeOpacity={0.8}
          style={pressableSurface.style as ViewStyle | undefined}
        >
          {content}
        </TouchableOpacity>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {content}
    </ComponentWrapper>
  )
}
