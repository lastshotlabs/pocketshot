import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { MultiSelectConfig, SelectOption } from './types'

const SCREEN_HEIGHT = Dimensions.get('window').height

function resolveSlotSurface(
  config: MultiSelectConfig,
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

export function MultiSelect({ config }: { config: MultiSelectConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string[] | undefined) : undefined
  const label =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const placeholder =
    config.placeholder != null
      ? String(resolveFromRef(config.placeholder, values) ?? '')
      : 'Select options...'
  const emptyMessage =
    config.emptyMessage != null
      ? String(resolveFromRef(config.emptyMessage, values) ?? '')
      : 'No options'

  const [selected, setSelected] = useState<string[]>(resolvedValue ?? config.defaultValue ?? [])
  const [modalVisible, setModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (resolvedValue != null) {
      setSelected(resolvedValue)
    }
  }, [resolvedValue])

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) {
      return config.options
    }
    const lowerSearch = searchText.toLowerCase()
    return config.options.filter((option) => option.label.toLowerCase().includes(lowerSearch))
  }, [config.options, searchText])

  const atLimit = config.maxSelections != null && selected.length >= config.maxSelections
  const selectedOptions = useMemo(
    () => config.options.filter((option) => selected.includes(option.value)),
    [config.options, selected],
  )
  const testId = config.testID ?? config.id

  const containerSurface = resolveSlotSurface(config, tokens, 'container', {
    gap: 'xs',
  })
  const labelSurface = resolveSlotSurface(config, tokens, 'label', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'medium',
    marginBottom: 'xs',
  })
  const triggerSurface = resolveSlotSurface(config, tokens, 'trigger', {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.inputBackground,
    border: '1 border',
    borderRadius: 'md',
    paddingX: 'md',
    paddingY: 'sm',
    minHeight: 48,
  })
  const triggerContentSurface = resolveSlotSurface(config, tokens, 'triggerContent', {
    flex: 1,
  })
  const chipsContainerSurface = resolveSlotSurface(config, tokens, 'chipsContainer', {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 'xs',
  })
  const chipSurface = resolveSlotSurface(config, tokens, 'chip', {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    borderRadius: 'full',
    paddingY: 'xs',
    paddingLeft: 'sm',
    paddingRight: 'xs',
    gap: 'xs',
  })
  const chipTextSurface = resolveSlotSurface(config, tokens, 'chipText', {
    color: 'primary-foreground',
    fontSize: 'xs',
    fontWeight: 'medium',
    maxWidth: 120,
  })
  const chipRemoveSurface = resolveSlotSurface(config, tokens, 'chipRemove', {
    width: 16,
    height: 16,
    borderRadius: 'full',
    backgroundColor: tokens.colors.primaryForeground + '30',
    alignItems: 'center',
    justifyContent: 'center',
  })
  const chipRemoveTextSurface = resolveSlotSurface(config, tokens, 'chipRemoveText', {
    color: 'primary-foreground',
    fontSize: 9,
    fontWeight: 'bold',
  })
  const placeholderTextSurface = resolveSlotSurface(config, tokens, 'placeholderText', {
    color: tokens.colors.inputPlaceholder,
    fontSize: 'base',
  })
  const chevronSurface = resolveSlotSurface(config, tokens, 'chevron', {
    color: 'muted',
    fontSize: 'xs',
    marginLeft: 'sm',
  })
  const backdropSurface = resolveSlotSurface(config, tokens, 'backdrop', {
    flex: 1,
    backgroundColor: tokens.colors.overlay + 'CC',
    justifyContent: 'end',
  })
  const panelSurface = resolveSlotSurface(config, tokens, 'panel', {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    maxHeight: SCREEN_HEIGHT * 0.6,
  })
  const panelHeaderSurface = resolveSlotSurface(config, tokens, 'panelHeader', {
    paddingX: 'lg',
    paddingTop: 'lg',
    paddingBottom: 'sm',
  })
  const panelTitleSurface = resolveSlotSurface(config, tokens, 'panelTitle', {
    color: 'foreground',
    fontSize: 'lg',
    fontWeight: 'semibold',
  })
  const searchContainerSurface = resolveSlotSurface(config, tokens, 'searchContainer', {
    paddingX: 'lg',
    paddingBottom: 'sm',
  })
  const searchInputSurface = resolveSlotSurface(config, tokens, 'searchInput', {
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: 'md',
    paddingX: 'md',
    paddingY: 'sm',
    fontSize: 'base',
    color: tokens.colors.inputText,
    border: '1 border',
  })
  const optionListSurface = resolveSlotSurface(config, tokens, 'optionList')
  const emptyTextSurface = resolveSlotSurface(config, tokens, 'emptyText', {
    color: 'muted',
    fontSize: 'base',
    textAlign: 'center',
    paddingY: 'xl',
  })
  const panelFooterSurface = resolveSlotSurface(config, tokens, 'panelFooter', {
    paddingX: 'lg',
    paddingY: 'md',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.divider,
  })
  const doneButtonSurface = resolveSlotSurface(config, tokens, 'doneButton', {
    backgroundColor: tokens.colors.primary,
    borderRadius: 'md',
    paddingY: 'md',
    alignItems: 'center',
  })
  const doneButtonTextSurface = resolveSlotSurface(config, tokens, 'doneButtonText', {
    color: 'primary-foreground',
    fontSize: 'base',
    fontWeight: 'semibold',
  })

  const commitSelected = useCallback(
    (nextSelected: string[]) => {
      setSelected(nextSelected)
      setValue(config.id, nextSelected)
      if (config.onChangeAction != null) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const handleToggleOption = useCallback(
    (value: string) => {
      const isSelected = selected.includes(value)
      if (isSelected) {
        commitSelected(selected.filter((current) => current !== value))
        return
      }
      if (atLimit) {
        return
      }
      commitSelected([...selected, value])
    },
    [atLimit, commitSelected, selected],
  )

  const handleRemoveChip = useCallback(
    (value: string) => {
      commitSelected(selected.filter((current) => current !== value))
    },
    [commitSelected, selected],
  )

  const renderChip = useCallback(
    (option: SelectOption) => (
      <View key={option.value} style={chipSurface.style as ViewStyle | undefined}>
        <Text style={mergeTextStyle(sharedTextStyle, chipTextSurface)} numberOfLines={1}>
          {option.label}
        </Text>
        <TouchableOpacity
          onPress={() => handleRemoveChip(option.value)}
          style={chipRemoveSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${option.label}`}
          testID={`${config.id}-chip-remove-${option.value}`}
          activeOpacity={0.7}
        >
          <Text style={mergeTextStyle(sharedTextStyle, chipRemoveTextSurface)}>X</Text>
        </TouchableOpacity>
      </View>
    ),
    [chipRemoveSurface, chipRemoveTextSurface, chipSurface, config.id, handleRemoveChip, sharedTextStyle, chipTextSurface],
  )

  const renderOption = useCallback(
    ({ item }: { item: SelectOption }) => {
      const isSelected = selected.includes(item.value)
      const isDisabled = !isSelected && atLimit
      const optionRowSurface = resolveSlotSurface(config, tokens, 'optionRow', {
        flexDirection: 'row',
        alignItems: 'center',
        paddingY: 'md',
        paddingX: 'lg',
        gap: 'md',
        opacity: isDisabled ? 0.4 : 1,
      })
      const checkboxIconSurface = resolveSlotSurface(config, tokens, 'checkboxIcon', {
        color: isSelected ? tokens.colors.primary : tokens.colors.textMuted,
        fontSize: 'base',
        width: 22,
      })
      const optionLabelSurface = resolveSlotSurface(config, tokens, 'optionLabel', {
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
          testID={`${config.id}-option-${item.value}`}
          activeOpacity={0.7}
        >
          <Text style={mergeTextStyle(sharedTextStyle, checkboxIconSurface)}>
            {isSelected ? '[x]' : '[ ]'}
          </Text>
          <Text style={mergeTextStyle(sharedTextStyle, optionLabelSurface)}>{item.label}</Text>
        </TouchableOpacity>
      )
    },
    [atLimit, config, handleToggleOption, selected, sharedTextStyle, tokens],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        {label != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, labelSurface)} accessibilityRole="text">
            {label}
          </Text>
        ) : null}
        <TouchableOpacity
          style={triggerSurface.style as ViewStyle | undefined}
          onPress={() => setModalVisible(true)}
          accessibilityRole="combobox"
          accessibilityLabel={label ?? config.id}
          accessibilityHint="Opens a list to select multiple options"
          accessibilityState={{ expanded: modalVisible }}
          testID={testId}
          activeOpacity={0.7}
        >
          <View style={triggerContentSurface.style as ViewStyle | undefined}>
            {selectedOptions.length > 0 ? (
              <View style={chipsContainerSurface.style as ViewStyle | undefined}>
                {selectedOptions.map(renderChip)}
              </View>
            ) : (
              <Text style={mergeTextStyle(sharedTextStyle, placeholderTextSurface)} numberOfLines={1}>
                {placeholder}
              </Text>
            )}
          </View>
          <Text style={mergeTextStyle(sharedTextStyle, chevronSurface)}>v</Text>
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
              <TouchableOpacity activeOpacity={1}>
                <View style={panelHeaderSurface.style as ViewStyle | undefined}>
                  <Text style={mergeTextStyle(sharedTextStyle, panelTitleSurface)}>
                    {label ?? 'Select options'}
                  </Text>
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
                    testID={`${config.id}-search`}
                  />
                </View>
                <FlatList<SelectOption>
                  data={filteredOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={renderOption}
                  ListEmptyComponent={
                    <Text style={mergeTextStyle(sharedTextStyle, emptyTextSurface)}>
                      {emptyMessage}
                    </Text>
                  }
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
                    testID={`${config.id}-done`}
                    activeOpacity={0.7}
                  >
                    <Text style={mergeTextStyle(sharedTextStyle, doneButtonTextSurface)}>Done</Text>
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
