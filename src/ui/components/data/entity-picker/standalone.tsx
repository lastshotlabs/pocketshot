import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface EntityOption {
  value: string
  label: string
  subtitle?: string
  avatarUrl?: string
}

export interface EntityPickerBaseProps {
  /** List of selectable entities. */
  data: EntityOption[]
  /** Controlled selected value. */
  value?: string
  /** Initial value (uncontrolled). */
  defaultValue?: string
  /** Field label rendered above the trigger. */
  label?: string
  /** Trigger placeholder when nothing is selected. */
  placeholder?: string
  /** Search input placeholder. */
  searchPlaceholder?: string
  /** Empty list message. */
  emptyMessage?: string
  /** Whether the modal exposes a search field. */
  searchable?: boolean
  /** Whether the trigger shows a clear button when a value is selected. */
  clearable?: boolean
  /** Called when the user selects (or clears) an entity. Receives the new value (or undefined). */
  onChange?: (value: string | undefined) => void
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

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
          { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' },
          avatarStyle,
        ]}
      >
        <Image
          source={{ uri: entity.avatarUrl }}
          style={[
            { width: size, height: size, borderRadius: size / 2, resizeMode: 'cover' },
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

/**
 * Standalone EntityPicker — plain React props, no manifest required.
 *
 * @example
 * <EntityPickerBase data={users} label="Owner" onChange={setOwner} />
 */
export function EntityPickerBase({
  data,
  value,
  defaultValue,
  label,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results',
  searchable = true,
  clearable = true,
  onChange,
  slots,
  testID,
  id,
}: EntityPickerBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue)
  const currentValue = isControlled ? value : internalValue

  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const panelTranslateY = useRef(new Animated.Value(PANEL_MAX_HEIGHT)).current

  useEffect(() => {
    if (isControlled) return
  }, [isControlled])

  const baseTextStyle: TextStyle = { ...sharedTextStyle }

  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      marginY: 'xs',
    },
    componentSurface: slots?.label,
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
    componentSurface: slots?.trigger,
  })
  const triggerTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'foreground' },
    componentSurface: slots?.triggerText,
  })
  const triggerPlaceholderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'muted' },
    componentSurface: slots?.triggerPlaceholder,
  })
  const triggerChevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.triggerChevron,
  })
  const clearButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { borderRadius: 'full', padding: 'xs' },
    componentSurface: slots?.clearButton,
  })
  const clearButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.clearButtonText,
  })
  const selectedAvatarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'primary' },
    componentSurface: slots?.selectedAvatar,
  })
  const selectedAvatarImageSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.selectedAvatarImage,
  })
  const selectedAvatarInitialsSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', fontWeight: 'bold', color: 'primary-foreground' },
    componentSurface: slots?.selectedAvatarInitials,
  })
  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'card', shadow: 'xl' },
    componentSurface: slots?.panel,
  })
  const dragHandleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border', borderRadius: 'full' },
    componentSurface: slots?.dragHandle,
  })
  const searchContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingY: 'sm' },
    componentSurface: slots?.searchContainer,
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
    componentSurface: slots?.searchInput,
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
    componentSurface: slots?.entityRow,
  })
  const entityAvatarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'primary' },
    componentSurface: slots?.entityAvatar,
  })
  const entityAvatarImageSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.entityAvatarImage,
  })
  const entityAvatarInitialsSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', fontWeight: 'bold', color: 'primary-foreground' },
    componentSurface: slots?.entityAvatarInitials,
  })
  const entityInfoSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.entityInfo,
  })
  const entityLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'foreground' },
    componentSurface: slots?.entityLabel,
  })
  const entitySubtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted' },
    componentSurface: slots?.entitySubtitle,
  })
  const checkmarkSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', fontWeight: 'bold', color: 'primary' },
    componentSurface: slots?.checkmark,
  })
  const separatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border' },
    componentSurface: slots?.separator,
  })
  const emptyStateSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingY: 'xl', alignItems: 'center', justifyContent: 'center' },
    componentSurface: slots?.emptyState,
  })
  const emptyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'muted', textAlign: 'center' },
    componentSurface: slots?.emptyText,
  })

  const selectedEntity = useMemo(
    () => data.find((entity) => entity.value === currentValue),
    [currentValue, data],
  )
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase()
    return data.filter(
      (entity) =>
        entity.label.toLowerCase().includes(query) ||
        (entity.subtitle != null && entity.subtitle.toLowerCase().includes(query)),
    )
  }, [data, searchQuery])

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
    (entity: EntityOption) => {
      if (!isControlled) setInternalValue(entity.value)
      onChange?.(entity.value)
      closeModal()
    },
    [closeModal, isControlled, onChange],
  )

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue(undefined)
    onChange?.(undefined)
  }, [isControlled, onChange])

  const keyExtractor = useCallback((item: EntityOption) => item.value, [])

  const renderEntityRow = useCallback(
    ({ item, index }: { item: EntityOption; index: number }) => {
      const isSelected = item.value === currentValue

      return (
        <View>
          <TouchableOpacity
            onPress={() => handleSelect(item)}
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
      currentValue,
      separatorSurface.style,
      tokens.spacing,
    ],
  )

  return (
    <View testID={testID}>
      {label != null ? (
        <Text style={{ ...baseTextStyle, ...(labelSurface.style as TextStyle | undefined) }}>
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={openModal}
        style={triggerSurface.style as ViewStyle | undefined}
        accessibilityRole="combobox"
        accessibilityLabel={`${label ?? 'Entity'} picker`}
        accessibilityState={{ expanded: modalVisible }}
        testID={testID ?? (id ? `${id}-trigger` : undefined)}
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
            testID={id ? `${id}-clear` : undefined}
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
                      testID={id ? `${id}-search` : undefined}
                    />
                  </View>
                ) : null}

                <FlatList
                  data={filteredData}
                  keyExtractor={keyExtractor}
                  renderItem={renderEntityRow}
                  keyboardShouldPersistTaps="handled"
                  accessibilityRole="list"
                  accessibilityLabel={`${label ?? 'Entity'} options`}
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
    </View>
  )
}
