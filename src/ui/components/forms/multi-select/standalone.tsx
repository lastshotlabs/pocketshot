import React, { useCallback, useMemo, useState } from 'react'
import {
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

const SCREEN_HEIGHT = Dimensions.get('window').height

export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectBaseProps {
  /** Options shown in the picker. */
  options: MultiSelectOption[]
  /** Controlled selected values. */
  value?: string[]
  /** Initial value when uncontrolled. */
  defaultValue?: string[]
  /** Called when the selection changes. */
  onChange?: (value: string[]) => void
  /** Visible label. */
  label?: string
  /** Placeholder when nothing is selected. */
  placeholder?: string
  /** Empty state message. */
  emptyMessage?: string
  /** Maximum number of selections allowed. */
  maxSelections?: number
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone MultiSelect — searchable bottom-sheet multi picker with chips.
 *
 * @example
 * <MultiSelectBase options={opts} value={selected} onChange={setSelected} label="Tags" />
 */
export function MultiSelectBase({
  options,
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Select options...',
  emptyMessage = 'No options',
  maxSelections,
  slots,
  style,
  testID,
  id,
}: MultiSelectBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<string[]>(defaultValue ?? [])
  const isControlled = value !== undefined
  const selected = isControlled ? (value ?? []) : internal
  const [modalVisible, setModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return options
    const lower = searchText.toLowerCase()
    return options.filter((option) => option.label.toLowerCase().includes(lower))
  }, [options, searchText])

  const atLimit = maxSelections != null && selected.length >= maxSelections
  const selectedOptions = useMemo(
    () => options.filter((option) => selected.includes(option.value)),
    [options, selected],
  )
  const testIDBase = testID ?? id

  function resolveSlotSurface(slot: string, implementationBase?: Record<string, unknown>) {
    return resolveSurfacePresentation({
      tokens,
      implementationBase,
      componentSurface: slots?.[slot],
    })
  }

  function mergeText(surface: ReturnType<typeof resolveSurfacePresentation>): TextStyle {
    return { ...sharedTextStyle, ...(surface.style as TextStyle | undefined) }
  }

  const containerSurface = resolveSlotSurface('container', { gap: 'xs' })
  const labelSurface = resolveSlotSurface('label', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'medium',
    marginBottom: 'xs',
  })
  const triggerSurface = resolveSlotSurface('trigger', {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.inputBackground,
    border: '1 border',
    borderRadius: 'md',
    paddingX: 'md',
    paddingY: 'sm',
    minHeight: 48,
  })
  const triggerContentSurface = resolveSlotSurface('triggerContent', { flex: 1 })
  const chipsContainerSurface = resolveSlotSurface('chipsContainer', {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 'xs',
  })
  const chipSurface = resolveSlotSurface('chip', {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    borderRadius: 'full',
    paddingY: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'xs',
    gap: 'xs',
  })
  const chipTextSurface = resolveSlotSurface('chipText', {
    color: 'primary-foreground',
    fontSize: 'xs',
    fontWeight: 'medium',
    maxWidth: 120,
  })
  const chipRemoveSurface = resolveSlotSurface('chipRemove', {
    width: 16,
    height: 16,
    borderRadius: 'full',
    backgroundColor: tokens.colors.primaryForeground + '30',
    alignItems: 'center',
    justifyContent: 'center',
  })
  const chipRemoveTextSurface = resolveSlotSurface('chipRemoveText', {
    color: 'primary-foreground',
    fontSize: 9,
    fontWeight: 'bold',
  })
  const placeholderTextSurface = resolveSlotSurface('placeholderText', {
    color: tokens.colors.inputPlaceholder,
    fontSize: 'base',
  })
  const chevronSurface = resolveSlotSurface('chevron', {
    color: 'muted',
    fontSize: 'xs',
    marginLeft: 'sm',
  })
  const backdropSurface = resolveSlotSurface('backdrop', {
    flex: 1,
    backgroundColor: tokens.colors.overlay + 'CC',
    justifyContent: 'end',
  })
  const panelSurface = resolveSlotSurface('panel', {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    maxHeight: SCREEN_HEIGHT * 0.6,
  })
  const panelHeaderSurface = resolveSlotSurface('panelHeader', {
    paddingX: 'lg',
    paddingTop: 'lg',
    paddingBottom: 'sm',
  })
  const panelTitleSurface = resolveSlotSurface('panelTitle', {
    color: 'foreground',
    fontSize: 'lg',
    fontWeight: 'semibold',
  })
  const searchContainerSurface = resolveSlotSurface('searchContainer', {
    paddingX: 'lg',
    paddingBottom: 'sm',
  })
  const searchInputSurface = resolveSlotSurface('searchInput', {
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: 'md',
    paddingX: 'md',
    paddingY: 'sm',
    fontSize: 'base',
    color: tokens.colors.inputText,
    border: '1 border',
  })
  const optionListSurface = resolveSlotSurface('optionList')
  const emptyTextSurface = resolveSlotSurface('emptyText', {
    color: 'muted',
    fontSize: 'base',
    textAlign: 'center',
    paddingY: 'xl',
  })
  const panelFooterSurface = resolveSlotSurface('panelFooter', {
    paddingX: 'lg',
    paddingY: 'md',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.divider,
  })
  const doneButtonSurface = resolveSlotSurface('doneButton', {
    backgroundColor: tokens.colors.primary,
    borderRadius: 'md',
    paddingY: 'md',
    alignItems: 'center',
  })
  const doneButtonTextSurface = resolveSlotSurface('doneButtonText', {
    color: 'primary-foreground',
    fontSize: 'base',
    fontWeight: 'semibold',
  })

  const commit = useCallback(
    (next: string[]) => {
      if (!isControlled) setInternal(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  const handleToggleOption = useCallback(
    (optionValue: string) => {
      const isSelected = selected.includes(optionValue)
      if (isSelected) {
        commit(selected.filter((current) => current !== optionValue))
        return
      }
      if (atLimit) return
      commit([...selected, optionValue])
    },
    [atLimit, commit, selected],
  )

  const handleRemoveChip = useCallback(
    (optionValue: string) => {
      commit(selected.filter((current) => current !== optionValue))
    },
    [commit, selected],
  )

  const renderChip = useCallback(
    (option: MultiSelectOption) => (
      <View key={option.value} style={chipSurface.style as ViewStyle | undefined}>
        <Text style={mergeText(chipTextSurface)} numberOfLines={1}>
          {option.label}
        </Text>
        <TouchableOpacity
          onPress={() => handleRemoveChip(option.value)}
          style={chipRemoveSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${option.label}`}
          testID={testIDBase ? `${testIDBase}-chip-remove-${option.value}` : undefined}
          activeOpacity={0.7}
        >
          <Text style={mergeText(chipRemoveTextSurface)}>X</Text>
        </TouchableOpacity>
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleRemoveChip, sharedTextStyle, testIDBase],
  )

  const renderOption = useCallback(
    ({ item }: { item: MultiSelectOption }) => {
      const isSelected = selected.includes(item.value)
      const isDisabled = !isSelected && Boolean(atLimit)
      const optionRowSurface = resolveSlotSurface('optionRow', {
        flexDirection: 'row',
        alignItems: 'center',
        paddingY: 'md',
        paddingX: 'lg',
        gap: 'md',
        opacity: isDisabled ? 0.4 : 1,
      })
      const checkboxIconSurface = resolveSlotSurface('checkboxIcon', {
        color: isSelected ? tokens.colors.primary : tokens.colors.textMuted,
        fontSize: 'base',
        width: 22,
      })
      const optionLabelSurface = resolveSlotSurface('optionLabel', {
        color: isSelected ? tokens.colors.primary : tokens.colors.text,
        fontSize: 'base',
        flex: 1,
        fontWeight: isSelected ? 'medium' : undefined,
      })

      return (
        <TouchableOpacity
          style={optionRowSurface.style as ViewStyle | undefined}
          onPress={() => handleToggleOption(item.value)}
          disabled={isDisabled}
          accessibilityRole="checkbox"
          accessibilityLabel={item.label}
          accessibilityState={{ checked: isSelected, disabled: isDisabled }}
          testID={testIDBase ? `${testIDBase}-option-${item.value}` : undefined}
          activeOpacity={0.7}
        >
          <Text style={mergeText(checkboxIconSurface)}>{isSelected ? '[x]' : '[ ]'}</Text>
          <Text style={mergeText(optionLabelSurface)}>{item.label}</Text>
        </TouchableOpacity>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atLimit, handleToggleOption, selected, sharedTextStyle, tokens, testIDBase],
  )

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]}>
      {label != null ? (
        <Text style={mergeText(labelSurface)} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        style={triggerSurface.style as ViewStyle | undefined}
        onPress={() => setModalVisible(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label ?? id}
        accessibilityHint="Opens a list to select multiple options"
        accessibilityState={{ expanded: modalVisible }}
        testID={testIDBase}
        activeOpacity={0.7}
      >
        <View style={triggerContentSurface.style as ViewStyle | undefined}>
          {selectedOptions.length > 0 ? (
            <View style={chipsContainerSurface.style as ViewStyle | undefined}>
              {selectedOptions.map(renderChip)}
            </View>
          ) : (
            <Text style={mergeText(placeholderTextSurface)} numberOfLines={1}>
              {placeholder}
            </Text>
          )}
        </View>
        <Text style={mergeText(chevronSurface)}>v</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false)
          setSearchText('')
        }}
        accessibilityViewIsModal
      >
        <TouchableOpacity
          style={backdropSurface.style as ViewStyle | undefined}
          onPress={() => {
            setModalVisible(false)
            setSearchText('')
          }}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close options panel"
        >
          <SafeAreaView style={panelSurface.style as ViewStyle | undefined}>
            <TouchableOpacity activeOpacity={1} accessible={false}>
              <View style={panelHeaderSurface.style as ViewStyle | undefined}>
                <Text style={mergeText(panelTitleSurface)}>{label ?? 'Select options'}</Text>
              </View>
              <View style={searchContainerSurface.style as ViewStyle | undefined}>
                <RNTextInput
                  style={searchInputSurface.style as TextStyle | undefined}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search..."
                  placeholderTextColor={tokens.colors.inputPlaceholder}
                  accessibilityRole="search"
                  accessibilityLabel="Search options"
                  testID={testIDBase ? `${testIDBase}-search` : undefined}
                />
              </View>
              <FlatList<MultiSelectOption>
                data={filteredOptions}
                keyExtractor={(item) => item.value}
                renderItem={renderOption}
                ListEmptyComponent={<Text style={mergeText(emptyTextSurface)}>{emptyMessage}</Text>}
                style={optionListSurface.style as ViewStyle | undefined}
                keyboardShouldPersistTaps="handled"
              />
              <View style={panelFooterSurface.style as ViewStyle | undefined}>
                <TouchableOpacity
                  style={doneButtonSurface.style as ViewStyle | undefined}
                  onPress={() => {
                    setModalVisible(false)
                    setSearchText('')
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  testID={testIDBase ? `${testIDBase}-done` : undefined}
                  activeOpacity={0.7}
                >
                  <Text style={mergeText(doneButtonTextSurface)}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
