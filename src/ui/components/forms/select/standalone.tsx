import React, { useState } from 'react'
import {
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectBaseProps {
  /** Options shown in the picker. */
  options: SelectOption[]
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called when the selection changes. */
  onChange?: (value: string) => void
  /** Visible label. */
  label?: string
  /** Placeholder shown when no option is selected. */
  placeholder?: string
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Select — modal-based single-choice picker.
 *
 * @example
 * <SelectBase label="Color" options={[{label:'Red',value:'r'}]} value={c} onChange={setC} />
 */
export function SelectBase({
  options,
  value,
  defaultValue,
  onChange,
  label,
  placeholder,
  slots,
  style,
  testID,
  id,
}: SelectBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<string | undefined>(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal
  const [modalVisible, setModalVisible] = useState(false)

  const selectedOption = options.find((option) => option.value === current)
  const displayText = selectedOption?.label ?? placeholder
  const isPlaceholder = selectedOption == null
  const activeStates: RuntimeSurfaceState[] = [
    ...(modalVisible ? (['open'] as const) : []),
    ...(selectedOption != null ? (['selected'] as const) : []),
  ]

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'xs' },
    componentSurface: slots?.container,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      marginBottom: 'xs',
    },
    componentSurface: slots?.label,
    activeStates,
  })
  const triggerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      bg: 'inputBackground',
      border: '1px solid inputBorder',
      borderRadius: 'md',
      paddingX: 'sm',
      paddingY: 'sm',
      minHeight: 48,
      states: { open: { border: '1px solid borderFocus' } },
    },
    componentSurface: slots?.trigger,
    activeStates,
  })
  const triggerTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'base',
      color: isPlaceholder ? 'inputPlaceholder' : 'inputText',
    },
    componentSurface: slots?.triggerText,
    activeStates,
  })
  const chevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted', marginLeft: 'sm' },
    componentSurface: slots?.chevron,
    activeStates,
  })
  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, bg: 'overlay', justifyContent: 'end', opacity: 0.8 },
    componentSurface: slots?.backdrop,
    activeStates,
  })
  const sheetSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderTopLeftRadius: 'xl',
      borderTopRightRadius: 'xl',
      maxHeight: '60%',
      paddingBottom: Platform.OS === 'android' ? tokens.spacing[4] : 0,
    },
    componentSurface: slots?.sheet,
    activeStates,
  })
  const sheetInnerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { padding: 'lg' },
    componentSurface: slots?.sheetInner,
    activeStates,
  })
  const sheetTitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
      marginBottom: 'md',
    },
    componentSurface: slots?.sheetTitle,
    activeStates,
  })

  function handleSelect(option: SelectOption) {
    if (!isControlled) setInternal(option.value)
    setModalVisible(false)
    onChange?.(option.value)
  }

  const testIDBase = testID ?? id

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]}>
      {label != null ? (
        <Text
          style={{ ...sharedTextStyle, ...(labelSurface.style as TextStyle | undefined) }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        style={triggerSurface.style as ViewStyle | undefined}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? id}
        accessibilityHint="Opens a list of options to choose from"
        testID={testIDBase}
      >
        <Text
          style={{
            ...sharedTextStyle,
            ...(triggerTextSurface.style as TextStyle | undefined),
          }}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Text
          style={{
            ...sharedTextStyle,
            ...(chevronSurface.style as TextStyle | undefined),
          }}
        >
          ▾
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal
      >
        <TouchableOpacity
          style={backdropSurface.style as ViewStyle | undefined}
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close options"
        >
          <SafeAreaView style={sheetSurface.style as ViewStyle | undefined}>
            <View style={sheetInnerSurface.style as ViewStyle | undefined}>
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(sheetTitleSurface.style as TextStyle | undefined),
                }}
              >
                {label ?? 'Select an option'}
              </Text>
              <FlatList<SelectOption>
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const selected = item.value === current
                  const optionStates: RuntimeSurfaceState[] = selected ? ['selected'] : []
                  const optionSurface = resolveSurfacePresentation({
                    tokens,
                    implementationBase: {
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingY: 'sm',
                      paddingX: 'xs',
                      borderRadius: 'md',
                      states: { selected: { bg: 'muted' } },
                    },
                    componentSurface: slots?.option,
                    activeStates: optionStates,
                  })
                  const optionTextSurface = resolveSurfacePresentation({
                    tokens,
                    implementationBase: {
                      flex: 1,
                      fontSize: 'base',
                      color: selected ? 'primary' : 'foreground',
                      fontWeight: selected ? 'semibold' : 'regular',
                    },
                    componentSurface: slots?.optionText,
                    activeStates: optionStates,
                  })
                  const checkmarkSurface = resolveSurfacePresentation({
                    tokens,
                    implementationBase: {
                      fontSize: 'base',
                      color: 'primary',
                      marginLeft: 'sm',
                    },
                    componentSurface: slots?.checkmark,
                    activeStates: optionStates,
                  })

                  return (
                    <TouchableOpacity
                      style={optionSurface.style as ViewStyle | undefined}
                      onPress={() => handleSelect(item)}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected }}
                      testID={testIDBase ? `${testIDBase}-option-${item.value}` : undefined}
                    >
                      <Text
                        style={{
                          ...sharedTextStyle,
                          ...(optionTextSurface.style as TextStyle | undefined),
                        }}
                      >
                        {item.label}
                      </Text>
                      {selected ? (
                        <Text
                          style={{
                            ...sharedTextStyle,
                            ...(checkmarkSurface.style as TextStyle | undefined),
                          }}
                        >
                          ✓
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  )
                }}
              />
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
