import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { MultiSelectConfig, SelectOption } from './types'

const SCREEN_HEIGHT = Dimensions.get('window').height

export function MultiSelect({ config }: { config: MultiSelectConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null
      ? (resolveFromRef(config.value, values) as string[] | undefined)
      : undefined

  const [selected, setSelected] = useState<string[]>(
    resolvedValue ?? config.defaultValue ?? [],
  )
  const [modalVisible, setModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (resolvedValue != null) {
      setSelected(resolvedValue)
    }
  }, [resolvedValue])

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return config.options
    const lower = searchText.toLowerCase()
    return config.options.filter((o) => o.label.toLowerCase().includes(lower))
  }, [config.options, searchText])

  const atLimit =
    config.maxSelections != null && selected.length >= config.maxSelections

  const handleToggleOption = useCallback(
    (value: string) => {
      const isSelected = selected.includes(value)
      let newSelected: string[]
      if (isSelected) {
        newSelected = selected.filter((v) => v !== value)
      } else {
        if (atLimit) return
        newSelected = [...selected, value]
      }
      setSelected(newSelected)
      setValue(config.id, newSelected)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [selected, atLimit, config.id, config.onChangeAction, setValue, dispatch],
  )

  const handleRemoveChip = useCallback(
    (value: string) => {
      const newSelected = selected.filter((v) => v !== value)
      setSelected(newSelected)
      setValue(config.id, newSelected)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [selected, config.id, config.onChangeAction, setValue, dispatch],
  )

  const handleClose = useCallback(() => {
    setModalVisible(false)
    setSearchText('')
  }, [])

  const selectedOptions = useMemo(
    () => config.options.filter((o) => selected.includes(o.value)),
    [config.options, selected],
  )

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const renderChip = useCallback(
    (option: SelectOption) => (
      <View
        key={option.value}
        style={styles.chip}
        accessibilityRole="none"
      >
        <Text style={styles.chipText} numberOfLines={1}>
          {option.label}
        </Text>
        <TouchableOpacity
          onPress={() => handleRemoveChip(option.value)}
          style={styles.chipRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${option.label}`}
          testID={`${config.id}-chip-remove-${option.value}`}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.chipRemoveText}>✕</Text>
        </TouchableOpacity>
      </View>
    ),
    [styles, handleRemoveChip, config.id],
  )

  const renderOption = useCallback(
    ({ item }: { item: SelectOption }) => {
      const isSelected = selected.includes(item.value)
      const isDisabled = !isSelected && atLimit
      return (
        <TouchableOpacity
          style={[styles.optionRow, isDisabled && styles.optionRowDisabled]}
          onPress={() => handleToggleOption(item.value)}
          disabled={isDisabled}
          accessibilityRole="checkbox"
          accessibilityLabel={item.label}
          accessibilityState={{ checked: isSelected, disabled: isDisabled }}
          testID={`${config.id}-option-${item.value}`}
        >
          <Text style={[styles.checkboxIcon, isSelected && styles.checkboxIconSelected]}>
            {isSelected ? '☑' : '☐'}
          </Text>
          <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )
    },
    [selected, atLimit, handleToggleOption, styles, config.id],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setModalVisible(true)}
          accessibilityRole="combobox"
          accessibilityLabel={config.label ?? config.id}
          accessibilityHint="Opens a list to select multiple options"
          accessibilityState={{ expanded: modalVisible }}
          testID={config.testID ?? config.id}
        >
          <View style={styles.triggerContent}>
            {selectedOptions.length > 0 ? (
              <View style={styles.chipsContainer}>
                {selectedOptions.map(renderChip)}
              </View>
            ) : (
              <Text style={styles.placeholderText} numberOfLines={1}>
                {config.placeholder}
              </Text>
            )}
          </View>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleClose}
          accessibilityViewIsModal
        >
          <TouchableOpacity
            style={styles.backdrop}
            onPress={handleClose}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close options panel"
          >
            <SafeAreaView style={[styles.panel, { maxHeight: SCREEN_HEIGHT * 0.6 }]}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>{config.label ?? 'Select options'}</Text>
                </View>
                <View style={styles.searchContainer}>
                  <RNTextInput
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search…"
                    placeholderTextColor={tokens.colors.inputPlaceholder}
                    accessibilityRole="search"
                    accessibilityLabel="Search options"
                    testID={`${config.id}-search`}
                  />
                </View>
                <FlatList<SelectOption>
                  data={filteredOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={renderOption}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>{config.emptyMessage}</Text>
                  }
                  style={styles.optionList}
                  keyboardShouldPersistTaps="handled"
                />
                <View style={styles.panelFooter}>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                    testID={`${config.id}-done`}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      minHeight: 48,
    },
    triggerContent: {
      flex: 1,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing[1],
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.full,
      paddingVertical: tokens.spacing[1],
      paddingLeft: tokens.spacing[2],
      paddingRight: tokens.spacing[1],
      gap: tokens.spacing[1],
    },
    chipText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightMedium,
      maxWidth: 120,
    },
    chipRemove: {
      width: 16,
      height: 16,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.primaryForeground + '30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipRemoveText: {
      fontSize: 9,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightBold,
    },
    placeholderText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputPlaceholder,
    },
    chevron: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginLeft: tokens.spacing[2],
    },
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay + 'CC',
      justifyContent: 'flex-end',
    },
    panel: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.xl,
      borderTopRightRadius: tokens.radius.xl,
      ...tokens.shadows.lg,
    },
    panelHeader: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    panelTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    searchContainer: {
      paddingHorizontal: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    searchInput: {
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    optionList: {
      flexGrow: 0,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[4],
      gap: tokens.spacing[3],
    },
    optionRowDisabled: {
      opacity: 0.4,
    },
    checkboxIcon: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.textMuted,
      width: 22,
    },
    checkboxIconSelected: {
      color: tokens.colors.primary,
    },
    optionLabel: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    optionLabelSelected: {
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      paddingVertical: tokens.spacing[6],
    },
    panelFooter: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      borderTopWidth: 1,
      borderTopColor: tokens.colors.divider,
    },
    doneButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[3],
      alignItems: 'center',
    },
    doneButtonText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
  })
}

