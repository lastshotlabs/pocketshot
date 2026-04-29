import React from 'react'
import {
  Image as RNImage,
  TouchableOpacity,
  type GestureResponderEvent,
  type ImageStyle,
  type ViewStyle,
} from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

let ExpoImage: typeof RNImage | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoImageModule = require('expo-image') as { Image: typeof RNImage }
  ExpoImage = expoImageModule.Image
} catch {
  ExpoImage = null
}

const ImageComponent = ExpoImage ?? RNImage

export type ImageResizeMode = 'cover' | 'contain' | 'stretch' | 'center' | 'repeat'

export interface ImageBaseProps {
  /** Image source URL. */
  src: string
  /** Accessible alt text. */
  alt?: string
  /** Width (number = px, string = token or dimension). */
  width?: number | string
  /** Height (number = px, string = token or dimension). */
  height?: number | string
  /** Aspect ratio (width/height) — used when height is omitted. */
  aspectRatio?: number
  /** Border radius. */
  borderRadius?: number | string
  /** Resize behavior. */
  resizeMode?: ImageResizeMode
  /** Press handler — wraps the image in a TouchableOpacity when set. */
  onPress?: (event: GestureResponderEvent) => void
  /** Style applied to the image element. */
  style?: ImageStyle
  /** Slot overrides (image, pressable). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
}

/**
 * Standalone Image — plain React props, no manifest required.
 *
 * @example
 * <ImageBase src="https://…/img.png" width={120} aspectRatio={1} />
 */
export function ImageBase({
  src,
  alt,
  width,
  height,
  aspectRatio,
  borderRadius,
  resizeMode,
  onPress,
  style,
  slots,
  testID,
}: ImageBaseProps) {
  const tokens = useTokens()

  const computedHeight =
    height != null
      ? height
      : aspectRatio != null && typeof width === 'number'
        ? width / aspectRatio
        : undefined

  const imageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: width ?? 200,
      height: computedHeight ?? 200,
      ...(aspectRatio != null && height == null && typeof width !== 'number'
        ? { aspectRatio }
        : undefined),
      ...(borderRadius != null ? { borderRadius } : undefined),
    },
    componentSurface: slots?.image,
  })
  const pressableSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.pressable,
  })

  const content = (
    <ImageComponent
      source={{ uri: src }}
      accessibilityLabel={alt}
      resizeMode={resizeMode}
      style={[imageSurface.style as ImageStyle | undefined, style]}
      testID={testID}
    />
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="imagebutton"
        accessibilityLabel={alt}
        activeOpacity={0.8}
        style={pressableSurface.style as ViewStyle | undefined}
      >
        {content}
      </TouchableOpacity>
    )
  }
  return content
}
