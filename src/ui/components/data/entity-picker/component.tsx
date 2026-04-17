import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal,
  FlatList,
  TextInput as RNTextInput,
  Dimensions,
  Image,
  type TextStyle,
  type ViewStyle,
  type ImageStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { EntityPickerConfig, EntityOption } from './types'

const SCREEN_HEIGHT = Dimensions.get('window').height
const PANEL_MAX_HEIGHT = SCREEN_HEIGHT * 0.7
const AVATAR_SIZE = 32

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/)
  if (parts.length === 1) return label.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

function EntityAvatar({
  entity,
  size,
  avatarStyle,
  imageStyle,
  initialsStyle,
}: {
  entity: EntityOption
  size: number
  avatarStyle?: ViewStyle
  imageStyle?: ImageStyle
  initialsStyle?: TextStyle
}) {
  if (entity.avatarUrl) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
          avatarStyle,
        ]}
      >
        <Image
          source={{ uri: entity.avatarUrl }}
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              resizeMode: 'cover',
            },
            imageStyle,
          ]}
          accessibilityLabel={`${entity.label} avatar`}
        />
      </View>
    )
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarStyle,
      ]}
    >
      <Text style={initialsStyle}>{getInitials(entity.label)}</Text>
    </View>
  )
}

export function EntityPicker({ config }: { config: EntityPickerConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedData = useMemo<EntityOption[]>(() => {
    if (isFromRef(config.data)) {
      const resolved = resolveFromRef(config.data, values)
      return Array.isArray(resolved) ? (resolved as EntityOption[]) : []
    }
    return config.data as EntityOption[]
  }, [config.data, values])

  const resolvedValue = useMemo<string | undefined>(() => {
    const value = config.value
    if (value == null) return undefined
    if (isFromRef(value)) {
      const resolved = resolveFromRef(value, values)
      return typeof resolved === 'string' ? resolved : undefined
    }
    return typeof value === 'string' ? value : undefined
  }, [config.value, values])

  const [internalValue, setInternalValue] = useState<string | undefined>(
    resolvedValue ?? config.defaultValue,
  )
  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const panelTranslateY = useRef(new Animated.Value(PANEL_MAX_HEIGHT)).current

  useEffect(() => {
    if (resolvedValue !== undefined) {
      setInternalValue(resolvedValue)
    }
  }, [resolvedValue])

  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      marginY: 'xs',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })
  const triggerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'sm',
      bg: 'input',
      border: '1px solid border',
      borderRadius: 'md',
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.trigger as Record<string, unknown> | undefined,
  })
  const triggerTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: config.slots?.triggerText as Record<string, unknown> | undefined,
  })
  const triggerPlaceholderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
    },
    componentSurface: config.slots?.triggerPlaceholder as Record<string, unknown> | undefined,
  })
  const triggerChevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.triggerChevron as Record<string, unknown> | undefined,
  })
  const clearButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: 'full',
      padding: 'xs',
    },
    componentSurface: config.slots?.clearButton as Record<string, unknown> | undefined,
  })
  const clearButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.clearButtonText as Record<string, unknown> | undefined,
  })
  const selectedAvatarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'primary',
    },
    componentSurface: config.slots?.selectedAvatar as Record<string, unknown> | undefined,
  })
  const selectedAvatarImageSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.selectedAvatarImage as Record<string, unknown> | undefined,
  })
  const selectedAvatarInitialsSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'bold',
      color: 'primary-foreground',
    },
    componentSurface: config.slots?.selectedAvatarInitials as Record<string, unknown> | undefined,
  })
  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'rgba(0,0,0,0.55)',
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      shadow: 'xl',
    },
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
  })
  const dragHandleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'border',
      borderRadius: 'full',
    },
    componentSurface: config.slots?.dragHandle as Record<string, unknown> | undefined,
  })
  const searchContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'sm',
    },
    componentSurface: config.slots?.searchContainer as Record<string, unknown> | undefined,
  })
  const searchInputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'popover',
      borderRadius: 'md',
      paddingX: 'md',
      paddingY: 'sm',
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: config.slots?.searchInput as Record<string, unknown> | undefined,
  })
  const entityRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'md',
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.entityRow as Record<string, unknown> | undefined,
  })
  const entityAvatarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'primary',
    },
    componentSurface: config.slots?.entityAvatar as Record<string, unknown> | undefined,
  })
  const entityAvatarImageSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.entityAvatarImage as Record<string, unknown> | undefined,
  })
  const entityAvatarInitialsSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'bold',
      color: 'primary-foreground',
    },
    componentSurface: config.slots?.entityAvatarInitials as Record<string, unknown> | undefined,
  })
  const entityInfoSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.entityInfo as Record<string, unknown> | undefined,
  })
  const entityLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: config.slots?.entityLabel as Record<string, unknown> | undefined,
  })
  const entitySubtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
    },
    componentSurface: config.slots?.entitySubtitle as Record<string, unknown> | undefined,
  })
  const checkmarkSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'bold',
      color: 'primary',
    },
    componentSurface: config.slots?.checkmark as Record<string, unknown> | undefined,
  })
  const separatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'border',
    },
    componentSurface: config.slots?.separator as Record<string, unknown> | undefined,
  })
  const emptyStateSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingY: 'xl',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: config.slots?.emptyState as Record<string, unknown> | undefined,
  })
  const emptyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
      textAlign: 'center',
    },
    componentSurface: config.slots?.emptyText as Record<string, unknown> | undefined,
  })

  const selectedEntity = useMemo(
    () => resolvedData.find((entity) => entity.value === internalValue),
    [internalValue, resolvedData],
  )
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return resolvedData
    const query = searchQuery.toLowerCase()
    return resolvedData.filter(
      (entity) =>
        entity.label.toLowerCase().includes(query) ||
        (entity.subtitle != null && entity.subtitle.toLowerCase().includes(query)),
    )
  }, [resolvedData, searchQuery])

  const openModal = useCallback(() => {
    setSearchQuery('')
    setModalVisible(true)
    Animated.spring(panelTranslateY, {
      toValue: 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start()
  }, [panelTranslateY])

  const closeModal = useCallback(() => {
    Animated.timing(panelTranslateY, {
      toValue: PANEL_MAX_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false)
      setSearchQuery('')
    })
  }, [panelTranslateY])

  const handleSelect = useCallback(
    async (entity: EntityOption) => {
      setInternalValue(entity.value)
      setValue(config.id, entity.value)
      closeModal()
      if (config.onChangeAction) {
        await dispatch(config.onChangeAction)
      }
    },
    [closeModal, config.id, config.onChangeAction, dispatch, setValue],
  )

  const handleClear = useCallback(() => {
    setInternalValue(undefined)
    setValue(config.id, null)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }, [config.id, config.onChangeAction, dispatch, setValue])

  const keyExtractor = useCallback((item: EntityOption) => item.value, [])

  const renderEntityRow = useCallback(
    ({ item, index }: { item: EntityOption; index: number }) => {
      const isSelected = item.value === internalValue

      return (
        <View>
          <TouchableOpacity
            onPress={() => void handleSelect(item)}
            style={entityRowSurface.style as ViewStyle | undefined}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isSelected }}
            testID={`entity-option-${item.value}`}
            activeOpacity={0.7}
          >
            <EntityAvatar
              entity={item}
              size={AVATAR_SIZE}
              avatarStyle={entityAvatarSurface.style as ViewStyle | undefined}
              imageStyle={entityAvatarImageSurface.style as ImageStyle | undefined}
              initialsStyle={{
                ...baseTextStyle,
                ...(entityAvatarInitialsSurface.style as TextStyle | undefined),
              }}
            />
            <View style={[{ flex: 1 }, entityInfoSurface.style as ViewStyle | undefined]}>
              <Text
                style={{
                  ...baseTextStyle,
                  ...(entityLabelSurface.style as TextStyle | undefined),
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.subtitle != null ? (
                <Text
                  style={{
                    ...baseTextStyle,
                    marginTop: 2,
                    ...(entitySubtitleSurface.style as TextStyle | undefined),
                  }}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
            {isSelected ? (
              <Text
                style={{
                  ...baseTextStyle,
                  ...(checkmarkSurface.style as TextStyle | undefined),
                }}
                accessibilityElementsHidden
              >
                Check
              </Text>
            ) : null}
          </TouchableOpacity>
          {index < filteredData.length - 1 ? (
            <View
              style={[
                { height: 1, marginHorizontal: tokens.spacing[3] },
                separatorSurface.style as ViewStyle | undefined,
              ]}
            />
          ) : null}
        </View>
      )
    },
    [
      baseTextStyle,
      checkmarkSurface.style,
      entityAvatarImageSurface.style,
      entityAvatarInitialsSurface.style,
      entityAvatarSurface.style,
      entityInfoSurface.style,
      entityLabelSurface.style,
      entityRowSurface.style,
      entitySubtitleSurface.style,
      filteredData.length,
      handleSelect,
      internalValue,
      separatorSurface.style,
      tokens.spacing,
    ],
  )

  const fieldLabel = config.label
  const placeholder = config.placeholder ?? 'Select...'
  const searchPlaceholder = config.searchPlaceholder ?? 'Search...'
  const emptyMessage = config.emptyMessage ?? 'No results'
  const searchable = config.searchable !== false
  const clearable = config.clearable !== false

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {fieldLabel != null ? (
        <Text
          style={{
            ...baseTextStyle,
            ...(labelSurface.style as TextStyle | undefined),
          }}
        >
          {fieldLabel}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={openModal}
        style={triggerSurface.style as ViewStyle | undefined}
        accessibilityRole="combobox"
        accessibilityLabel={`${fieldLabel ?? 'Entity'} picker`}
        accessibilityState={{ expanded: modalVisible }}
        testID={config.testID ?? `${config.id}-trigger`}
        activeOpacity={0.8}
      >
        {selectedEntity != null ? (
          <EntityAvatar
            entity={selectedEntity}
            size={AVATAR_SIZE - 8}
            avatarStyle={selectedAvatarSurface.style as ViewStyle | undefined}
            imageStyle={selectedAvatarImageSurface.style as ImageStyle | undefined}
            initialsStyle={{
              ...baseTextStyle,
              ...(selectedAvatarInitialsSurface.style as TextStyle | undefined),
            }}
          />
        ) : null}

        {selectedEntity != null ? (
          <Text
            style={{
              ...baseTextStyle,
              flex: 1,
              ...(triggerTextSurface.style as TextStyle | undefined),
            }}
            numberOfLines={1}
          >
            {selectedEntity.label}
          </Text>
        ) : (
          <Text
            style={{
              ...baseTextStyle,
              flex: 1,
              ...(triggerPlaceholderSurface.style as TextStyle | undefined),
            }}
            numberOfLines={1}
          >
            {placeholder}
          </Text>
        )}

        {selectedEntity != null && clearable ? (
          <TouchableOpacity
            onPress={handleClear}
            style={clearButtonSurface.style as ViewStyle | undefined}
            accessibilityRole="button"
            accessibilityLabel="Clear selection"
            testID={`${config.id}-clear`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                ...baseTextStyle,
                ...(clearButtonTextSurface.style as TextStyle | undefined),
              }}
            >
              Clear
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={{
              ...baseTextStyle,
              ...(triggerChevronSurface.style as TextStyle | undefined),
            }}
            accessibilityElementsHidden
          >
            Open
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={closeModal} accessibilityLabel="Close entity picker">
          <View
            style={[
              { flex: 1, justifyContent: 'flex-end' },
              backdropSurface.style as ViewStyle | undefined,
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  {
                    borderTopLeftRadius: tokens.radius.lg,
                    borderTopRightRadius: tokens.radius.lg,
                    maxHeight: PANEL_MAX_HEIGHT,
                  },
                  panelSurface.style as ViewStyle | undefined,
                  { transform: [{ translateY: panelTranslateY }] },
                ]}
              >
                <View
                  style={[
                    {
                      alignSelf: 'center',
                      marginTop: tokens.spacing[2],
                      marginBottom: tokens.spacing[2],
                      width: 40,
                      height: 4,
                    },
                    dragHandleSurface.style as ViewStyle | undefined,
                  ]}
                  accessibilityElementsHidden
                />

                {searchable ? (
                  <View style={searchContainerSurface.style as ViewStyle | undefined}>
                    <RNTextInput
                      style={searchInputSurface.style as TextStyle | undefined}
                      placeholder={searchPlaceholder}
                      placeholderTextColor={tokens.colors.inputPlaceholder}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCorrect={false}
                      autoCapitalize="none"
                      clearButtonMode="while-editing"
                      accessibilityLabel="Search entities"
                      testID={`${config.id}-search`}
                    />
                  </View>
                ) : null}

                <FlatList
                  data={filteredData}
                  keyExtractor={keyExtractor}
                  renderItem={renderEntityRow}
                  keyboardShouldPersistTaps="handled"
                  accessibilityRole="list"
                  accessibilityLabel={`${fieldLabel ?? 'Entity'} options`}
                  ListEmptyComponent={
                    <View style={emptyStateSurface.style as ViewStyle | undefined}>
                      <Text
                        style={{
                          ...baseTextStyle,
                          ...(emptyTextSurface.style as TextStyle | undefined),
                        }}
                      >
                        {emptyMessage}
                      </Text>
                    </View>
                  }
                />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ComponentWrapper>
  )
}
