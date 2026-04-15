import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { MediaPickerConfig, SelectedMediaItem } from './types'

// ── Optional peer dep helpers ─────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImageUri(uri: string): boolean {
  const lower = uri.toLowerCase()
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.heic')
  )
}

function getMediaTypeLabel(types: readonly string[]): string {
  if (types.length === 3) return 'media'
  return types.join(' & ')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MediaPicker({ config }: { config: MediaPickerConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [items, setItems] = useState<SelectedMediaItem[]>([])

  const maxSelections = config.maxSelections ?? 1
  const quality = config.quality ?? 0.8
  const mediaTypes = config.mediaTypes ?? ['image']

  const commitItems = useCallback(
    (updated: SelectedMediaItem[]) => {
      setItems(updated)
      setValue(config.id, updated)
      void dispatch(config.onSelect)
    },
    [config.id, config.onSelect, setValue, dispatch],
  )

  const handlePick = useCallback(async () => {
    const remaining = maxSelections - items.length
    if (remaining <= 0) return

    const needsImages = mediaTypes.includes('image') || mediaTypes.includes('video')
    const needsDocs = mediaTypes.includes('document')

    const imagePicker = tryImagePicker()
    const docPicker = tryDocumentPicker()

    if (needsImages && !needsDocs && imagePicker == null) {
      Alert.alert(
        'expo-image-picker required',
        'Install expo-image-picker to select images and videos:\n\nnpx expo install expo-image-picker',
      )
      return
    }

    if (needsDocs && !needsImages && docPicker == null) {
      Alert.alert(
        'expo-document-picker required',
        'Install expo-document-picker to select documents:\n\nnpx expo install expo-document-picker',
      )
      return
    }

    if (imagePicker == null && docPicker == null) {
      Alert.alert(
        'Picker unavailable',
        'Install expo-image-picker or expo-document-picker to enable media selection.',
      )
      return
    }

    let picked: SelectedMediaItem[] = []

    // Decide which picker to use
    if (needsDocs && !needsImages) {
      // Documents only
      if (docPicker == null) return
      const result = await docPicker.getDocumentAsync({
        multiple: remaining > 1,
        copyToCacheDirectory: false,
      })
      if (!result.canceled && result.assets) {
        picked = result.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          type: a.mimeType,
          size: a.size,
        }))
      }
    } else if (imagePicker != null) {
      // Images/video via image picker
      const mediaType = mediaTypes.includes('video')
        ? imagePicker.MediaTypeOptions.All
        : imagePicker.MediaTypeOptions.Images

      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsMultipleSelection: remaining > 1,
        quality,
      })
      if (!result.canceled && result.assets) {
        picked = result.assets.map((a) => ({
          uri: a.uri,
          name: a.fileName ?? a.uri.split('/').pop() ?? 'file',
          type: a.mimeType,
          size: a.fileSize,
        }))
      }
    } else if (docPicker != null) {
      // Fallback to document picker
      const result = await docPicker.getDocumentAsync({
        multiple: remaining > 1,
        copyToCacheDirectory: false,
      })
      if (!result.canceled && result.assets) {
        picked = result.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          type: a.mimeType,
          size: a.size,
        }))
      }
    }

    const updated = [...items, ...picked].slice(0, maxSelections)
    commitItems(updated)
  }, [items, maxSelections, mediaTypes, quality, commitItems])

  const handleRemove = useCallback(
    (uri: string) => {
      const updated = items.filter((i) => i.uri !== uri)
      setItems(updated)
      setValue(config.id, updated)
    },
    [items, config.id, setValue],
  )

  const isDisabled = items.length >= maxSelections
  const styles = useMemo(() => makeStyles(tokens, isDisabled), [tokens, isDisabled])
  const testId = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        {/* Pick button */}
        <TouchableOpacity
          onPress={() => void handlePick()}
          disabled={isDisabled}
          style={styles.pickButton}
          accessibilityRole="button"
          accessibilityLabel={`Select ${getMediaTypeLabel(mediaTypes)}`}
          accessibilityHint={`Up to ${maxSelections} items`}
          accessibilityState={{ disabled: isDisabled }}
          testID={`${testId}-pick`}
          activeOpacity={0.7}
        >
          <Text style={styles.pickIcon} accessibilityElementsHidden>
            +
          </Text>
          <Text style={styles.pickLabel}>
            {isDisabled ? 'Maximum reached' : `Select ${getMediaTypeLabel(mediaTypes)}`}
          </Text>
          <Text style={styles.pickSubtitle}>
            {items.length}/{maxSelections} selected
          </Text>
        </TouchableOpacity>

        {/* Selected items horizontal scroll */}
        {items.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
          >
            {items.map((item) => (
              <View key={item.uri} style={styles.previewItem}>
                {isImageUri(item.uri) || item.type?.startsWith('image/') ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                    accessibilityLabel={item.name}
                  />
                ) : (
                  <View style={styles.filePlaceholder}>
                    <Text style={styles.filePlaceholderIcon} accessibilityElementsHidden>
                      {item.type?.startsWith('video/') ? '\u{25B6}' : '\u{1F4C4}'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => handleRemove(item.uri)}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}
                  testID={`${testId}-remove-${item.name}`}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={styles.removeText}>{'\u2715'}</Text>
                </TouchableOpacity>

                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, isDisabled: boolean) {
  return StyleSheet.create({
    pickButton: {
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 1.5,
      borderColor: tokens.colors.border,
      borderStyle: 'dashed',
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[5],
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isDisabled ? 0.5 : 1,
    },
    pickIcon: {
      fontSize: 28,
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightBold,
      marginBottom: tokens.spacing[1],
    },
    pickLabel: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    pickSubtitle: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    previewScroll: {
      marginTop: tokens.spacing[3],
    },
    previewContent: {
      gap: tokens.spacing[2],
    },
    previewItem: {
      width: 80,
      alignItems: 'center',
    },
    thumbnail: {
      width: 72,
      height: 72,
      borderRadius: tokens.radius.md,
    },
    filePlaceholder: {
      width: 72,
      height: 72,
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    filePlaceholderIcon: {
      fontSize: 24,
    },
    removeButton: {
      position: 'absolute',
      top: -4,
      right: 0,
      width: 22,
      height: 22,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.destructive,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeText: {
      color: tokens.colors.destructiveForeground,
      fontSize: 11,
      fontWeight: tokens.typography.fontWeightBold,
    },
    itemName: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      textAlign: 'center',
      width: 72,
    },
  })
}

