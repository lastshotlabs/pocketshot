import React, { useCallback, useState } from 'react'
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { SelectedMediaItem } from './types'

export type MediaPickerType = 'image' | 'video' | 'document'

function tryImagePicker() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-image-picker') as {
      launchImageLibraryAsync: (options: {
        mediaTypes: string
        allowsMultipleSelection: boolean
        quality: number
      }) => Promise<{
        canceled: boolean
        assets?: Array<{ uri: string; fileName?: string; fileSize?: number; mimeType?: string }>
      }>
      MediaTypeOptions: { Images: string; Videos: string; All: string }
    }
  } catch {
    return null
  }
}

function tryDocumentPicker() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-document-picker') as {
      getDocumentAsync: (options: { multiple: boolean; copyToCacheDirectory: boolean }) => Promise<{
        canceled: boolean
        assets?: Array<{ uri: string; name: string; size?: number; mimeType?: string }>
      }>
    }
  } catch {
    return null
  }
}

function isImageUri(uri: string): boolean {
  const lowerUri = uri.toLowerCase()
  return (
    lowerUri.endsWith('.jpg') ||
    lowerUri.endsWith('.jpeg') ||
    lowerUri.endsWith('.png') ||
    lowerUri.endsWith('.gif') ||
    lowerUri.endsWith('.webp') ||
    lowerUri.endsWith('.heic')
  )
}

function getMediaTypeLabel(types: readonly string[]): string {
  return types.length === 3 ? 'media' : types.join(' and ')
}

function resolveSlot(
  slots: Record<string, Record<string, unknown> | undefined> | undefined,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface: slots?.[slot],
  })
}

function mergeTextStyle(
  sharedTextStyle: TextStyle,
  surface: ReturnType<typeof resolveSurfacePresentation>,
): TextStyle {
  return {
    ...sharedTextStyle,
    ...(surface.style as TextStyle | undefined),
  }
}

export interface MediaPickerBaseProps {
  /** Allowed media kinds. Defaults to ['image']. */
  mediaTypes?: MediaPickerType[]
  /** Maximum items to keep selected. */
  maxSelections?: number
  /** Image picker quality (0-1). */
  quality?: number
  /** Controlled selection. */
  value?: SelectedMediaItem[]
  /** Initial selection (uncontrolled). */
  defaultValue?: SelectedMediaItem[]
  /** Called whenever the selection changes (after pick or remove). */
  onChange?: (items: SelectedMediaItem[]) => void
  /** Called only when the user picks new items (not on removal). */
  onSelect?: (items: SelectedMediaItem[]) => void
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone MediaPicker — plain React props, no manifest required.
 *
 * @example
 * <MediaPickerBase mediaTypes={['image']} maxSelections={3} onSelect={setImages} />
 */
export function MediaPickerBase({
  mediaTypes = ['image'],
  maxSelections = 1,
  quality = 0.8,
  value,
  defaultValue,
  onChange,
  onSelect,
  style,
  slots,
  testID,
  id,
}: MediaPickerBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = value !== undefined
  const [internalItems, setInternalItems] = useState<SelectedMediaItem[]>(defaultValue ?? [])
  const items = isControlled ? value! : internalItems

  const isDisabled = items.length >= maxSelections
  const testId = testID ?? id

  const pickButtonSurface = resolveSlot(slots, tokens, 'pickButton', {
    backgroundColor: tokens.colors.surfaceAlt,
    border: '1 border',
    borderRadius: 'lg',
    padding: 'lg',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
  })
  const pickIconSurface = resolveSlot(slots, tokens, 'pickIcon', {
    color: 'primary',
    fontSize: 'base',
    fontWeight: 'bold',
    marginBottom: 'xs',
  })
  const pickLabelSurface = resolveSlot(slots, tokens, 'pickLabel', {
    color: 'foreground',
    fontSize: 'base',
    fontWeight: 'medium',
    marginBottom: 'xs',
  })
  const pickSubtitleSurface = resolveSlot(slots, tokens, 'pickSubtitle', {
    color: 'muted',
    fontSize: 'xs',
  })
  const previewScrollSurface = resolveSlot(slots, tokens, 'previewScroll', {
    marginTop: 'md',
  })
  const previewContentSurface = resolveSlot(slots, tokens, 'previewContent', {
    gap: 'sm',
  })
  const previewItemSurface = resolveSlot(slots, tokens, 'previewItem', {
    width: 80,
    alignItems: 'center',
  })
  const thumbnailSurface = resolveSlot(slots, tokens, 'thumbnail', {
    width: 72,
    height: 72,
    borderRadius: 'md',
  })
  const filePlaceholderSurface = resolveSlot(slots, tokens, 'filePlaceholder', {
    width: 72,
    height: 72,
    borderRadius: 'md',
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    border: '1 border',
  })
  const filePlaceholderIconSurface = resolveSlot(slots, tokens, 'filePlaceholderIcon', {
    color: 'muted',
    fontSize: 'base',
    fontWeight: 'bold',
  })
  const removeButtonSurface = resolveSlot(slots, tokens, 'removeButton', {
    position: 'absolute',
    top: -4,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 'full',
    backgroundColor: tokens.colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  })
  const removeTextSurface = resolveSlot(slots, tokens, 'removeText', {
    color: tokens.colors.destructiveForeground,
    fontSize: 'xs',
    fontWeight: 'bold',
  })
  const itemNameSurface = resolveSlot(slots, tokens, 'itemName', {
    color: 'muted',
    fontSize: 'xs',
    marginTop: 'xs',
    textAlign: 'center',
    width: 72,
  })

  const updateItems = useCallback(
    (next: SelectedMediaItem[]) => {
      if (!isControlled) {
        setInternalItems(next)
      }
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  const handlePick = useCallback(async () => {
    const remaining = maxSelections - items.length
    if (remaining <= 0) {
      return
    }

    const needsImages = mediaTypes.includes('image') || mediaTypes.includes('video')
    const needsDocuments = mediaTypes.includes('document')
    const imagePicker = tryImagePicker()
    const documentPicker = tryDocumentPicker()

    if (imagePicker == null && documentPicker == null) {
      Alert.alert(
        'Picker unavailable',
        'Install expo-image-picker or expo-document-picker to enable media selection.',
      )
      return
    }

    if (needsImages && !needsDocuments && imagePicker == null) {
      Alert.alert('Image picker required', 'Install expo-image-picker to select images and videos.')
      return
    }

    if (needsDocuments && !needsImages && documentPicker == null) {
      Alert.alert('Document picker required', 'Install expo-document-picker to select documents.')
      return
    }

    let picked: SelectedMediaItem[] = []

    if (needsDocuments && !needsImages) {
      const result = await documentPicker!.getDocumentAsync({
        multiple: remaining > 1,
        copyToCacheDirectory: false,
      })

      if (!result.canceled && result.assets != null) {
        picked = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
          size: asset.size,
        }))
      }
    } else if (imagePicker != null) {
      const pickerMediaTypes = mediaTypes.includes('video')
        ? imagePicker.MediaTypeOptions.All
        : imagePicker.MediaTypeOptions.Images

      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: pickerMediaTypes,
        allowsMultipleSelection: remaining > 1,
        quality,
      })

      if (!result.canceled && result.assets != null) {
        picked = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName ?? asset.uri.split('/').pop() ?? 'file',
          type: asset.mimeType,
          size: asset.fileSize,
        }))
      }
    } else if (documentPicker != null) {
      const result = await documentPicker.getDocumentAsync({
        multiple: remaining > 1,
        copyToCacheDirectory: false,
      })

      if (!result.canceled && result.assets != null) {
        picked = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
          size: asset.size,
        }))
      }
    }

    const next = [...items, ...picked].slice(0, maxSelections)
    updateItems(next)
    if (picked.length > 0) {
      onSelect?.(next)
    }
  }, [items, maxSelections, mediaTypes, onSelect, quality, updateItems])

  const handleRemove = useCallback(
    (uri: string) => {
      updateItems(items.filter((item) => item.uri !== uri))
    },
    [items, updateItems],
  )

  return (
    <View testID={testId} style={style}>
      <TouchableOpacity
        onPress={() => void handlePick()}
        disabled={isDisabled}
        style={pickButtonSurface.style as ViewStyle | undefined}
        accessibilityRole="button"
        accessibilityLabel={`Select ${getMediaTypeLabel(mediaTypes)}`}
        accessibilityHint={`Up to ${maxSelections} items`}
        accessibilityState={{ disabled: isDisabled }}
        testID={testId ? `${testId}-pick` : undefined}
        activeOpacity={0.7}
      >
        <Text style={mergeTextStyle(sharedTextStyle, pickIconSurface)}>+</Text>
        <Text style={mergeTextStyle(sharedTextStyle, pickLabelSurface)}>
          {isDisabled ? 'Maximum reached' : `Select ${getMediaTypeLabel(mediaTypes)}`}
        </Text>
        <Text style={mergeTextStyle(sharedTextStyle, pickSubtitleSurface)}>
          {`${items.length}/${maxSelections} selected`}
        </Text>
      </TouchableOpacity>

      {items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={previewScrollSurface.style as ViewStyle | undefined}
          contentContainerStyle={previewContentSurface.style as ViewStyle | undefined}
        >
          {items.map((item) => (
            <View key={item.uri} style={previewItemSurface.style as ViewStyle | undefined}>
              {isImageUri(item.uri) || item.type?.startsWith('image/') ? (
                <Image
                  source={{ uri: item.uri }}
                  style={thumbnailSurface.style as ImageStyle | undefined}
                  resizeMode="cover"
                  accessibilityLabel={item.name}
                />
              ) : (
                <View style={filePlaceholderSurface.style as ViewStyle | undefined}>
                  <Text style={mergeTextStyle(sharedTextStyle, filePlaceholderIconSurface)}>
                    {item.type?.startsWith('video/') ? 'Video' : 'File'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => handleRemove(item.uri)}
                style={removeButtonSurface.style as ViewStyle | undefined}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}
                testID={testId ? `${testId}-remove-${item.name}` : undefined}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                activeOpacity={0.7}
              >
                <Text style={mergeTextStyle(sharedTextStyle, removeTextSurface)}>X</Text>
              </TouchableOpacity>

              <Text style={mergeTextStyle(sharedTextStyle, itemNameSurface)} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  )
}
