import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
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
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { FileUploaderConfig, FileItem } from './types'

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

function formatBytes(bytes?: number): string {
  if (bytes == null) {
    return ''
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageType(type?: string, uri?: string): boolean {
  if (type?.startsWith('image/')) {
    return true
  }

  if (uri == null) {
    return false
  }

  const lowerUri = uri.toLowerCase()
  return (
    lowerUri.endsWith('.jpg') ||
    lowerUri.endsWith('.jpeg') ||
    lowerUri.endsWith('.png') ||
    lowerUri.endsWith('.gif') ||
    lowerUri.endsWith('.webp')
  )
}

function getAcceptLabel(accept: FileUploaderConfig['accept']): string {
  switch (accept) {
    case 'image':
      return 'Images only'
    case 'video':
      return 'Videos only'
    case 'document':
      return 'Documents only'
    default:
      return 'Any file type'
  }
}

function resolveSlotSurface(
  config: FileUploaderConfig,
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

export function FileUploader({ config }: { config: FileUploaderConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const resolvedLabel =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const resolvedInitial = config.value != null ? resolveFromRef(config.value, values) : undefined
  const initialUris = Array.isArray(resolvedInitial) ? resolvedInitial : []

  const [files, setFiles] = useState<FileItem[]>(() =>
    initialUris.map((uri) => ({
      uri,
      name: uri.split('/').pop() ?? uri,
    })),
  )

  useEffect(() => {
    const nextResolved = config.value != null ? resolveFromRef(config.value, values) : undefined
    if (!Array.isArray(nextResolved)) {
      return
    }

    setFiles(
      nextResolved.map((uri) => ({
        uri,
        name: uri.split('/').pop() ?? uri,
      })),
    )
  }, [config.value, values])

  const accept = config.accept ?? 'any'
  const multiple = config.multiple ?? false
  const maxFiles = config.maxFiles ?? 5
  const maxSizeMb = config.maxSizeMb ?? 10
  const isDisabled = files.length >= maxFiles
  const testId = config.testID ?? config.id

  const labelSurface = resolveSlotSurface(config, tokens, 'label', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'medium',
    marginBottom: 'sm',
  })
  const dropZoneSurface = resolveSlotSurface(config, tokens, 'dropZone', {
    backgroundColor: tokens.colors.surfaceAlt,
    border: '1 border',
    borderRadius: 'lg',
    padding: 'xl',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
  })
  const dropIconSurface = resolveSlotSurface(config, tokens, 'dropIcon', {
    color: 'muted',
    fontSize: 'sm',
    fontWeight: 'bold',
    marginBottom: 'sm',
  })
  const dropLabelSurface = resolveSlotSurface(config, tokens, 'dropLabel', {
    color: 'foreground',
    fontSize: 'base',
    fontWeight: 'medium',
    marginBottom: 'xs',
  })
  const dropSubtitleSurface = resolveSlotSurface(config, tokens, 'dropSubtitle', {
    color: 'muted',
    fontSize: 'xs',
  })
  const dropDisabledNoteSurface = resolveSlotSurface(config, tokens, 'dropDisabledNote', {
    color: 'warning',
    fontSize: 'xs',
    marginTop: 'xs',
  })
  const fileListSurface = resolveSlotSurface(config, tokens, 'fileList', {
    marginTop: 'md',
    gap: 'sm',
  })
  const fileRowSurface = resolveSlotSurface(config, tokens, 'fileRow', {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    border: '1 border',
    borderRadius: 'md',
    padding: 'sm',
  })
  const thumbnailSurface = resolveSlotSurface(config, tokens, 'thumbnail', {
    width: 48,
    height: 48,
    borderRadius: 'sm',
    marginRight: 'sm',
  })
  const fileIconSurface = resolveSlotSurface(config, tokens, 'fileIcon', {
    width: 48,
    height: 48,
    borderRadius: 'sm',
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 'sm',
  })
  const fileIconTextSurface = resolveSlotSurface(config, tokens, 'fileIconText', {
    color: 'muted',
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const fileMetaSurface = resolveSlotSurface(config, tokens, 'fileMeta', {
    flex: 1,
  })
  const fileNameSurface = resolveSlotSurface(config, tokens, 'fileName', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'medium',
  })
  const fileSizeSurface = resolveSlotSurface(config, tokens, 'fileSize', {
    color: 'muted',
    fontSize: 'xs',
    marginTop: 2,
  })
  const removeButtonSurface = resolveSlotSurface(config, tokens, 'removeButton', {
    padding: 'xs',
    marginLeft: 'sm',
  })
  const removeTextSurface = resolveSlotSurface(config, tokens, 'removeText', {
    color: 'muted',
    fontSize: 'base',
    fontWeight: 'bold',
  })

  const commitFiles = useCallback(
    (nextFiles: FileItem[]) => {
      setFiles(nextFiles)
      setValue(config.id, nextFiles.map((file) => file.uri))
      if (config.onChangeAction != null) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const handlePick = useCallback(async () => {
    const imagePicker = tryImagePicker()
    const documentPicker = tryDocumentPicker()

    if (imagePicker == null && documentPicker == null) {
      Alert.alert(
        'Picker unavailable',
        'Install expo-image-picker or expo-document-picker to enable file selection.',
      )
      return
    }

    const remaining = maxFiles - files.length
    if (remaining <= 0) {
      return
    }

    let picked: FileItem[] = []

    if (accept === 'document') {
      if (documentPicker == null) {
        Alert.alert(
          'Document picker required',
          'Install expo-document-picker to pick documents.',
        )
        return
      }

      const result = await documentPicker.getDocumentAsync({
        multiple: multiple && remaining > 1,
        copyToCacheDirectory: false,
      })

      if (!result.canceled && result.assets != null) {
        picked = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          type: asset.mimeType,
        }))
      }
    } else if (imagePicker != null) {
      const mediaTypes =
        accept === 'image'
          ? imagePicker.MediaTypeOptions.Images
          : accept === 'video'
            ? imagePicker.MediaTypeOptions.Videos
            : imagePicker.MediaTypeOptions.All

      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsMultipleSelection: multiple && remaining > 1,
        quality: 1,
      })

      if (!result.canceled && result.assets != null) {
        picked = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName ?? asset.uri.split('/').pop() ?? 'file',
          size: asset.fileSize,
          type: asset.mimeType,
        }))
      }
    } else if (documentPicker != null) {
      const result = await documentPicker.getDocumentAsync({
        multiple: multiple && remaining > 1,
        copyToCacheDirectory: false,
      })

      if (!result.canceled && result.assets != null) {
        picked = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          type: asset.mimeType,
        }))
      }
    }

    const maxBytes = maxSizeMb * 1024 * 1024
    const validFiles = picked.filter((file) => {
      if (file.size != null && file.size > maxBytes) {
        Alert.alert('File too large', `"${file.name}" exceeds the ${maxSizeMb} MB limit.`)
        return false
      }
      return true
    })

    commitFiles([...files, ...validFiles].slice(0, maxFiles))
  }, [accept, commitFiles, files, maxFiles, maxSizeMb, multiple])

  const handleRemove = useCallback(
    (uri: string) => {
      commitFiles(files.filter((file) => file.uri !== uri))
    },
    [commitFiles, files],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        {resolvedLabel != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, labelSurface)} accessibilityRole="text">
            {resolvedLabel}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={() => void handlePick()}
          disabled={isDisabled}
          style={dropZoneSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityLabel={`Select ${getAcceptLabel(accept).toLowerCase()}`}
          accessibilityHint={`Up to ${maxFiles} files, max ${maxSizeMb} MB each`}
          accessibilityState={{ disabled: isDisabled }}
          testID={`${testId}-pick`}
          activeOpacity={0.7}
        >
          <Text style={mergeTextStyle(sharedTextStyle, dropIconSurface)}>Add</Text>
          <Text style={mergeTextStyle(sharedTextStyle, dropLabelSurface)}>
            Tap to select files
          </Text>
          <Text style={mergeTextStyle(sharedTextStyle, dropSubtitleSurface)}>
            {`${getAcceptLabel(accept)} - Max ${maxSizeMb} MB`}
          </Text>
          {isDisabled ? (
            <Text style={mergeTextStyle(sharedTextStyle, dropDisabledNoteSurface)}>
              {`Maximum ${maxFiles} files reached`}
            </Text>
          ) : null}
        </TouchableOpacity>

        {files.length > 0 ? (
          <View style={fileListSurface.style as ViewStyle | undefined}>
            {files.map((file) => (
              <View key={file.uri} style={fileRowSurface.style as ViewStyle | undefined}>
                {isImageType(file.type, file.uri) ? (
                  <Image
                    source={{ uri: file.uri }}
                    style={thumbnailSurface.style as ImageStyle | undefined}
                    resizeMode="cover"
                    accessibilityLabel={file.name}
                  />
                ) : (
                  <View style={fileIconSurface.style as ViewStyle | undefined}>
                    <Text style={mergeTextStyle(sharedTextStyle, fileIconTextSurface)}>File</Text>
                  </View>
                )}

                <View style={fileMetaSurface.style as ViewStyle | undefined}>
                  <Text
                    style={mergeTextStyle(sharedTextStyle, fileNameSurface)}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {file.name}
                  </Text>
                  {file.size != null ? (
                    <Text style={mergeTextStyle(sharedTextStyle, fileSizeSurface)}>
                      {formatBytes(file.size)}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() => handleRemove(file.uri)}
                  style={removeButtonSurface.style as ViewStyle | undefined}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${file.name}`}
                  testID={`${testId}-remove-${file.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={mergeTextStyle(sharedTextStyle, removeTextSurface)}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
