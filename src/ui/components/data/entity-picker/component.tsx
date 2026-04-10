import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Modal,
  FlatList,
  TextInput as RNTextInput,
  Dimensions,
  Image,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { EntityPickerConfig, EntityOption } from './types'

const SCREEN_HEIGHT = Dimensions.get('window').height
const PANEL_MAX_HEIGHT = SCREEN_HEIGHT * 0.7
const AVATAR_SIZE = 32

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/)
  if (parts.length === 1) return label.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    triggerField: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderWidth: 1,
      borderColor: tokens.colors.inputBorder,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[2],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    selectedAvatar: {
      width: AVATAR_SIZE - 8,
      height: AVATAR_SIZE - 8,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    selectedAvatarImage: {
      width: AVATAR_SIZE - 8,
      height: AVATAR_SIZE - 8,
      borderRadius: tokens.radius.full,
      resizeMode: 'cover',
    },
    selectedAvatarInitials: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.primaryForeground,
    },
    triggerText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    triggerPlaceholder: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputPlaceholder,
    },
    triggerChevron: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    clearButton: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.full,
    },
    clearButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      lineHeight: 18,
    },
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      justifyContent: 'flex-end',
    },
    panel: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.lg,
      borderTopRightRadius: tokens.radius.lg,
      maxHeight: PANEL_MAX_HEIGHT,
      ...tokens.shadows.xl,
    },
    dragHandle: {
      alignSelf: 'center',
      marginTop: tokens.spacing[2],
      marginBottom: tokens.spacing[2],
      width: 40,
      height: 4,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.border,
    },
    searchContainer: {
      paddingHorizontal: tokens.spacing[3],
      paddingBottom: tokens.spacing[2],
    },
    searchInput: {
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    entityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[3],
    },
    entityAvatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    entityAvatarImage: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: tokens.radius.full,
      resizeMode: 'cover',
    },
    entityAvatarInitials: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.primaryForeground,
    },
    entityInfo: {
      flex: 1,
    },
    entityLabel: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    entitySubtitle: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: 2,
    },
    checkmark: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightBold,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
      marginHorizontal: tokens.spacing[3],
    },
    emptyContainer: {
      paddingVertical: tokens.spacing[8],
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: tokens.spacing[6],
    },
  })
}

// ---------------------------------------------------------------------------
// Avatar helper
// ---------------------------------------------------------------------------

function EntityAvatar({
  entity,
  size,
  avatarStyle,
  imageStyle,
  initialsStyle,
}: {
  entity: EntityOption
  size: number
  avatarStyle: object
  imageStyle: object
  initialsStyle: object
}) {
  if (entity.avatarUrl) {
    return (
      <View style={[avatarStyle, { width: size, height: size }]}>
        <Image
          source={{ uri: entity.avatarUrl }}
          style={[imageStyle, { width: size, height: size }]}
          accessibilityLabel={`${entity.label} avatar`}
        />
      </View>
    )
  }
  return (
    <View style={[avatarStyle, { width: size, height: size }]}>
      <Text style={initialsStyle}>{getInitials(entity.label)}</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// EntityPicker
// ---------------------------------------------------------------------------

/**
 * A field that opens a searchable slide-up panel to select a single entity.
 * Supports static option arrays and from-ref data binding. Publishes selected
 * value to ScreenContext via config.id.
 */
export function EntityPicker({ config }: { config: EntityPickerConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Resolve data from static array or from-ref
  const resolvedData = useMemo<EntityOption[]>(() => {
    const raw = config.data
    if (isFromRef(raw)) {
      const resolved = resolveFromRef(raw, values)
      return Array.isArray(resolved) ? (resolved as EntityOption[]) : []
    }
    return raw as EntityOption[]
  }, [config.data, values])

  // Resolve current value from prop or from-ref
  const resolvedValue = useMemo<string | undefined>(() => {
    const v = config.value
    if (v === undefined || v === null) return undefined
    if (isFromRef(v)) return resolveFromRef<string>(v as unknown as string, values)
    return v as unknown as string
  }, [config.value, values])

  const [internalValue, setInternalValue] = useState<string | undefined>(
    resolvedValue ?? config.defaultValue,
  )
  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const panelTranslateY = useRef(new Animated.Value(PANEL_MAX_HEIGHT)).current

  // Keep internal value in sync with external from-ref
  useEffect(() => {
    if (resolvedValue !== undefined) {
      setInternalValue(resolvedValue)
    }
  }, [resolvedValue])

  const selectedEntity = useMemo(
    () => resolvedData.find((e) => e.value === internalValue),
    [resolvedData, internalValue],
  )

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return resolvedData
    const q = searchQuery.toLowerCase()
    return resolvedData.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        (e.subtitle != null && e.subtitle.toLowerCase().includes(q)),
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
    [config.id, config.onChangeAction, closeModal, dispatch, setValue],
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
        <>
          <TouchableOpacity
            onPress={() => handleSelect(item)}
            style={styles.entityRow}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isSelected }}
            testID={`entity-option-${item.value}`}
            activeOpacity={0.7}
          >
            <EntityAvatar
              entity={item}
              size={AVATAR_SIZE}
              avatarStyle={styles.entityAvatar}
              imageStyle={styles.entityAvatarImage}
              initialsStyle={styles.entityAvatarInitials}
            />
            <View style={styles.entityInfo}>
              <Text style={styles.entityLabel} numberOfLines={1}>
                {item.label}
              </Text>
              {item.subtitle != null && (
                <Text style={styles.entitySubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {isSelected && (
              <Text style={styles.checkmark} accessibilityElementsHidden>
                ✓
              </Text>
            )}
          </TouchableOpacity>
          {index < filteredData.length - 1 && <View style={styles.separator} />}
        </>
      )
    },
    [internalValue, handleSelect, styles, filteredData.length],
  )

  const triggerTestID = config.testID ?? `${config.id}-trigger`
  const fieldLabel = config.label

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {fieldLabel != null && <Text style={styles.label}>{fieldLabel}</Text>}

      {/* Trigger field */}
      <TouchableOpacity
        onPress={openModal}
        style={styles.triggerField}
        accessibilityRole="combobox"
        accessibilityLabel={`${fieldLabel ?? 'Entity'} picker`}
        accessibilityState={{ expanded: modalVisible }}
        testID={triggerTestID}
        activeOpacity={0.8}
      >
        {selectedEntity != null && (
          <EntityAvatar
            entity={selectedEntity}
            size={AVATAR_SIZE - 8}
            avatarStyle={styles.selectedAvatar}
            imageStyle={styles.selectedAvatarImage}
            initialsStyle={styles.selectedAvatarInitials}
          />
        )}

        {selectedEntity != null ? (
          <Text style={styles.triggerText} numberOfLines={1}>
            {selectedEntity.label}
          </Text>
        ) : (
          <Text style={styles.triggerPlaceholder} numberOfLines={1}>
            {config.placeholder ?? 'Select…'}
          </Text>
        )}

        {selectedEntity != null && (config.clearable ?? true) ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear selection"
            testID={`${config.id}-clear`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.triggerChevron} accessibilityElementsHidden>
            ▼
          </Text>
        )}
      </TouchableOpacity>

      {/* Bottom sheet modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={closeModal} accessibilityLabel="Close entity picker">
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[styles.panel, { transform: [{ translateY: panelTranslateY }] }]}
              >
                {/* Drag handle */}
                <View style={styles.dragHandle} accessibilityElementsHidden />

                {/* Search input */}
                {(config.searchable ?? true) && (
                  <View style={styles.searchContainer}>
                    <RNTextInput
                      style={styles.searchInput}
                      placeholder={config.searchPlaceholder ?? 'Search…'}
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
                )}

                {/* Entity list */}
                <FlatList
                  data={filteredData}
                  keyExtractor={keyExtractor}
                  renderItem={renderEntityRow}
                  contentContainerStyle={
                    filteredData.length === 0 ? undefined : styles.listContent
                  }
                  keyboardShouldPersistTaps="handled"
                  accessibilityRole="list"
                  accessibilityLabel={`${fieldLabel ?? 'Entity'} options`}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>{config.emptyMessage ?? 'No results'}</Text>
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
