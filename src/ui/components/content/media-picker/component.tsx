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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { MediaPickerConfig, SelectedMediaItem } from './types'

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
      getDocumentAsync: (options: {
        multiple: boolean
        copyToCacheDirectory: boolean
      }) => Promise<{
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

function resolveSlotSurface(
  config: MediaPickerConfig,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface:
      (config.slots as Record<string, Record<string, unknown> | undefined> | undefined)?.[slot],
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

export function MediaPicker({ config }: { config: MediaPickerConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const [items, setItems] = useState<SelectedMediaItem[]>([])

  const maxSelections = config.maxSelections ?? 1
  const quality = config.quality ?? 0.8
  const mediaTypes = config.mediaTypes ?? ['image']
  const isDisabled = items.length >= maxSelections
  const testId = config.testID ?? config.id

  const pickButtonSurface = resolveSlotSurface(config, tokens, 'pickButton', {
    backgroundColor: tokens.colors.surfaceAlt,
    border: '1 border',
    borderRadius: 'lg',
    padding: 'lg',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
  })
  const pickIconSurface = resolveSlotSurface(config, tokens, 'pickIcon', {
    color: 'primary',
    fontSize: 'base',
    fontWeight: 'bold',
    marginBottom: 'xs',
  })
  const pickLabelSurface = resolveSlotSurface(config, tokens, 'pickLabel', {
    color: 'foreground',
    fontSize: 'base',
    fontWeight: 'medium',
    marginBottom: 'xs',
  })
  const pickSubtitleSurface = resolveSlotSurface(config, tokens, 'pickSubtitle', {
    color: 'muted',
    fontSize: 'xs',
  })
  const previewScrollSurface = resolveSlotSurface(config, tokens, 'previewScroll', {
    marginTop: 'md',
  })
  const previewContentSurface = resolveSlotSurface(config, tokens, 'previewContent', {
    gap: 'sm',
  })
  const previewItemSurface = resolveSlotSurface(config, tokens, 'previewItem', {
    width: 80,
    alignItems: 'center',
  })
  const thumbnailSurface = resolveSlotSurface(config, tokens, 'thumbnail', {
    width: 72,
    height: 72,
    borderRadius: 'md',
  })
  const filePlaceholderSurface = resolveSlotSurface(config, tokens, 'filePlaceholder', {
    width: 72,
    height: 72,
    borderRadius: 'md',
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    border: '1 border',
  })
  const filePlaceholderIconSurface = resolveSlotSurface(config, tokens, 'filePlaceholderIcon', {
    color: 'muted',
    fontSize: 'base',
    fontWeight: 'bold',
  })
  const removeButtonSurface = resolveSlotSurface(config, tokens, 'removeButton', {
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
  const removeTextSurface = resolveSlotSurface(config, tokens, 'removeText', {
    color: tokens.colors.destructiveForeground,
    fontSize: 'xs',
    fontWeight: 'bold',
  })
  const itemNameSurface = resolveSlotSurface(config, tokens, 'itemName', {
    color: 'muted',
    fontSize: 'xs',
    marginTop: 'xs',
    textAlign: 'center',
    width: 72,
  })

  const commitItems = useCallback(
    (nextItems: SelectedMediaItem[]) => {
      setItems(nextItems)
      setValue(config.id, nextItems)
      void dispatch(config.onSelect)
    },
    [config.id, config.onSelect, dispatch, setValue],
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
      Alert.alert(
        'Image picker required',
        'Install expo-image-picker to select images and videos.',
      )
      return
    }

    if (needsDocuments && !needsImages && documentPicker == null) {
      Alert.alert(
        'Document picker required',
        'Install expo-document-picker to select documents.',
      )
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

    commitItems([...items, ...picked].slice(0, maxSelections))
  }, [commitItems, items, maxSelections, mediaTypes, quality])

  const handleRemove = useCallback(
    (uri: string) => {
      const nextItems = items.filter((item) => item.uri !== uri)
      setItems(nextItems)
      setValue(config.id, nextItems)
    },
    [config.id, items, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        <TouchableOpacity
          onPress={() => void handlePick()}
          disabled={isDisabled}
          style={pickButtonSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityLabel={`Select ${getMediaTypeLabel(mediaTypes)}`}
          accessibilityHint={`Up to ${maxSelections} items`}
          accessibilityState={{ disabled: isDisabled }}
          testID={`${testId}-pick`}
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
                  testID={`${testId}-remove-${item.name}`}
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
    </ComponentWrapper>
  )
}
