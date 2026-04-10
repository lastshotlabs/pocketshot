import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, FlatList } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { FileUploaderConfig, FileItem } from './types'

// ── Optional peer dep helpers ──────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageType(type?: string, uri?: string): boolean {
  if (type?.startsWith('image/')) return true
  if (uri != null) {
    const lower = uri.toLowerCase()
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp')
  }
  return false
}

function getAcceptLabel(accept: FileUploaderConfig['accept']): string {
  switch (accept) {
    case 'image': return 'Images only'
    case 'video': return 'Videos only'
    case 'document': return 'Documents only'
    default: return 'Any file type'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FileUploader({ config }: { config: FileUploaderConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedInitial = config.value != null ? resolveFromRef(config.value, values) : undefined
  const initialUris = Array.isArray(resolvedInitial) ? (resolvedInitial as string[]) : []

  const [files, setFiles] = useState<FileItem[]>(() =>
    initialUris.map((uri) => ({ uri, name: uri.split('/').pop() ?? uri })),
  )

  // Sync if value changes from outside
  useEffect(() => {
    const resolved = config.value != null ? resolveFromRef(config.value, values) : undefined
    if (Array.isArray(resolved)) {
      setFiles((resolved as string[]).map((uri) => ({ uri, name: uri.split('/').pop() ?? uri })))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.value])

  const maxFiles = config.maxFiles ?? 5
  const maxSizeMb = config.maxSizeMb ?? 10
  const accept = config.accept ?? 'any'
  const multiple = config.multiple ?? false

  const commitFiles = useCallback(
    (updated: FileItem[]) => {
      setFiles(updated)
      setValue(config.id, updated.map((f) => f.uri))
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, setValue, dispatch],
  )

  const handlePick = useCallback(async () => {
    const imagePicker = tryImagePicker()
    const docPicker = tryDocumentPicker()

    if (imagePicker == null && docPicker == null) {
      Alert.alert(
        'Picker unavailable',
        'Install expo-image-picker or expo-document-picker to enable file selection.',
      )
      return
    }

    const remaining = maxFiles - files.length
    if (remaining <= 0) return

    let picked: FileItem[] = []

    if (accept === 'document') {
      if (docPicker == null) {
        Alert.alert('expo-document-picker required', 'Install expo-document-picker to pick documents.')
        return
      }
      const result = await docPicker.getDocumentAsync({
        multiple: multiple && remaining > 1,
        copyToCacheDirectory: false,
      })
      if (!result.canceled && result.assets) {
        picked = result.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          size: a.size,
          type: a.mimeType,
        }))
      }
    } else {
      if (imagePicker == null) {
        // Fall back to document picker for any/image/video
        if (docPicker == null) {
          Alert.alert('No picker available', 'Install expo-image-picker to select files.')
          return
        }
        const result = await docPicker.getDocumentAsync({
          multiple: multiple && remaining > 1,
          copyToCacheDirectory: false,
        })
        if (!result.canceled && result.assets) {
          picked = result.assets.map((a) => ({
            uri: a.uri,
            name: a.name,
            size: a.size,
            type: a.mimeType,
          }))
        }
      } else {
        const mediaType =
          accept === 'image'
            ? imagePicker.MediaTypeOptions.Images
            : accept === 'video'
              ? imagePicker.MediaTypeOptions.Videos
              : imagePicker.MediaTypeOptions.All

        const result = await imagePicker.launchImageLibraryAsync({
          mediaTypes: mediaType,
          allowsMultipleSelection: multiple && remaining > 1,
          quality: 1,
        })
        if (!result.canceled && result.assets) {
          picked = result.assets.map((a) => ({
            uri: a.uri,
            name: a.fileName ?? a.uri.split('/').pop() ?? 'file',
            size: a.fileSize,
            type: a.mimeType,
          }))
        }
      }
    }

    // Size validation
    const maxBytes = maxSizeMb * 1024 * 1024
    const valid = picked.filter((f) => {
      if (f.size != null && f.size > maxBytes) {
        Alert.alert('File too large', `"${f.name}" exceeds the ${maxSizeMb} MB limit.`)
        return false
      }
      return true
    })

    const updated = [...files, ...valid].slice(0, maxFiles)
    commitFiles(updated)
  }, [accept, files, maxFiles, maxSizeMb, multiple, commitFiles])

  const handleRemove = useCallback(
    (uri: string) => {
      commitFiles(files.filter((f) => f.uri !== uri))
    },
    [files, commitFiles],
  )

  const isDisabled = files.length >= maxFiles
  const styles = useMemo(() => makeStyles(tokens, isDisabled), [tokens, isDisabled])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View testID={config.testID ?? config.id}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}

        {/* Drop zone */}
        <TouchableOpacity
          onPress={() => void handlePick()}
          disabled={isDisabled}
          style={styles.dropZone}
          accessibilityRole="button"
          accessibilityLabel={`Select ${getAcceptLabel(accept).toLowerCase()}`}
          accessibilityHint={`Up to ${maxFiles} files, max ${maxSizeMb} MB each`}
          accessibilityState={{ disabled: isDisabled }}
          testID={`${config.testID ?? config.id}-pick`}
          activeOpacity={0.7}
        >
          <Text style={styles.dropIcon} accessibilityElementsHidden>📎</Text>
          <Text style={styles.dropLabel}>Tap to select files</Text>
          <Text style={styles.dropSubtitle}>
            {getAcceptLabel(accept)} · Max {maxSizeMb} MB
          </Text>
          {isDisabled && (
            <Text style={styles.dropDisabledNote}>Maximum {maxFiles} files reached</Text>
          )}
        </TouchableOpacity>

        {/* File list */}
        {files.length > 0 && (
          <FlatList
            data={files}
            keyExtractor={(item) => item.uri}
            scrollEnabled={false}
            style={styles.fileList}
            renderItem={({ item }) => (
              <View style={styles.fileRow}>
                {isImageType(item.type, item.uri) ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                    accessibilityLabel={item.name}
                  />
                ) : (
                  <View style={styles.fileIcon}>
                    <Text style={styles.fileIconText} accessibilityElementsHidden>📄</Text>
                  </View>
                )}

                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                    {item.name}
                  </Text>
                  {item.size != null && (
                    <Text style={styles.fileSize}>{formatBytes(item.size)}</Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleRemove(item.uri)}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}
                  testID={`${config.testID ?? config.id}-remove-${item.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeText}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, isDisabled: boolean) {
  return StyleSheet.create({
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[2],
    },
    dropZone: {
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 1.5,
      borderColor: tokens.colors.border,
      borderStyle: 'dashed',
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[6],
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isDisabled ? 0.5 : 1,
    },
    dropIcon: {
      fontSize: 28,
      marginBottom: tokens.spacing[2],
    },
    dropLabel: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    dropSubtitle: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    dropDisabledNote: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.warning,
      marginTop: tokens.spacing[1],
    },
    fileList: {
      marginTop: tokens.spacing[3],
    },
    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.md,
      padding: tokens.spacing[2],
      marginBottom: tokens.spacing[2],
    },
    thumbnail: {
      width: 48,
      height: 48,
      borderRadius: tokens.radius.sm,
      marginRight: tokens.spacing[2],
    },
    fileIcon: {
      width: 48,
      height: 48,
      borderRadius: tokens.radius.sm,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing[2],
    },
    fileIconText: {
      fontSize: 22,
    },
    fileMeta: {
      flex: 1,
    },
    fileName: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    fileSize: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: 2,
    },
    removeButton: {
      padding: tokens.spacing[1],
      marginLeft: tokens.spacing[2],
    },
    removeText: {
      fontSize: 20,
      color: tokens.colors.textMuted,
      lineHeight: 22,
    },
  })
}
