import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal as RNModal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface SortPickerOption {
  value: string
  label: string
  icon?: string
}

export interface SortPickerBaseProps {
  /** Whether the picker is visible. */
  open: boolean
  /** Called to close the picker. */
  onClose: () => void
  /** Available sort options. */
  options: SortPickerOption[]
  /** Currently selected value. */
  value?: string
  /** Initial selection (uncontrolled). */
  defaultValue?: string
  /** Called when the user selects an option. */
  onSelect?: (option: SortPickerOption) => void
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone SortPicker — plain React props, no manifest required.
 *
 * @example
 * <SortPickerBase open={open} onClose={() => setOpen(false)} options={opts} onSelect={setSort} />
 */
export function SortPickerBase({
  open,
  onClose,
  options,
  value,
  defaultValue,
  onSelect,
  slots,
  testID,
  id,
}: SortPickerBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = value !== undefined
  const [internal, setInternal] = useState<string>(defaultValue ?? '')
  const selected = isControlled ? (value as string) : internal

  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(300)).current
  const baseTestID = testID ?? id ?? 'sort-picker'

  useEffect(() => {
    if (open) {
      opacity.setValue(0)
      translateY.setValue(300)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [open, opacity, translateY])

  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: slots?.header,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'muted',
      textAlign: 'center',
    },
    componentSurface: slots?.title,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border' },
    componentSurface: slots?.divider,
  })
  const optionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'md',
      gap: 'sm',
      states: { selected: { bg: 'accent' } },
    },
    componentSurface: slots?.option,
  })
  const optionLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
      states: { selected: { color: 'primary', fontWeight: 'semibold' } },
    },
    componentSurface: slots?.optionLabel,
  })
  const optionIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { color: 'muted' },
    componentSurface: slots?.optionIcon,
  })
  const checkmarkSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { color: 'primary', fontWeight: 'bold' },
    componentSurface: slots?.checkmark,
  })
  const cancelButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingY: 'md' },
    componentSurface: slots?.cancelButton,
  })
  const cancelLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: 'foreground',
      textAlign: 'center',
    },
    componentSurface: slots?.cancelLabel,
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

  const baseTextStyle: TextStyle = { ...sharedTextStyle }

  const handleSelect = useCallback(
    (option: SortPickerOption) => {
      if (!isControlled) setInternal(option.value)
      onSelect?.(option)
      onClose()
    },
    [isControlled, onClose, onSelect],
  )

  const renderItem = useCallback(
    ({ item }: { item: SortPickerOption }) => {
      const isSelected = item.value === selected
      const activeStates: RuntimeSurfaceState[] | undefined = isSelected ? ['selected'] : undefined

      return (
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          style={
            resolveSurfacePresentation({
              tokens,
              implementationBase: optionSurface.resolvedConfigForWrapper,
              activeStates,
            }).style as ViewStyle | undefined
          }
          accessibilityRole="radio"
          accessibilityLabel={item.label}
          accessibilityState={{ checked: isSelected }}
          testID={`${baseTestID}-option-${item.value}`}
          activeOpacity={0.7}
        >
          {item.icon != null ? (
            <Text
              style={{
                ...baseTextStyle,
                width: 24,
                textAlign: 'center',
                ...(optionIconSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
            >
              {item.icon}
            </Text>
          ) : null}
          <Text
            style={{
              ...baseTextStyle,
              flex: 1,
              ...(resolveSurfacePresentation({
                tokens,
                implementationBase: optionLabelSurface.resolvedConfigForWrapper,
                activeStates,
              }).style as TextStyle | undefined),
            }}
          >
            {item.label}
          </Text>
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
      )
    },
    [
      baseTestID,
      baseTextStyle,
      checkmarkSurface.style,
      handleSelect,
      optionIconSurface.style,
      optionLabelSurface.resolvedConfigForWrapper,
      optionSurface.resolvedConfigForWrapper,
      selected,
      tokens,
    ],
  )

  const keyExtractor = useCallback((item: SortPickerOption) => item.value, [])

  return (
    <RNModal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Animated.View
          style={[
            { flex: 1, justifyContent: 'flex-end' },
            backdropSurface.style as ViewStyle | undefined,
            { opacity },
          ]}
        >
          <TouchableWithoutFeedback accessible={false}>
            <Animated.View
              style={[
                {
                  borderTopLeftRadius: tokens.radius.lg,
                  borderTopRightRadius: tokens.radius.lg,
                  paddingBottom: tokens.spacing[8],
                },
                panelSurface.style as ViewStyle | undefined,
                { transform: [{ translateY }] },
              ]}
            >
              <View style={headerSurface.style as ViewStyle | undefined}>
                <Text
                  style={{
                    ...baseTextStyle,
                    ...(titleSurface.style as TextStyle | undefined),
                  }}
                  accessibilityRole="header"
                >
                  Sort by
                </Text>
              </View>
              <View style={[{ height: 1 }, dividerSurface.style as ViewStyle | undefined]} />

              <FlatList
                data={options}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                scrollEnabled={false}
              />

              <TouchableOpacity
                onPress={onClose}
                style={cancelButtonSurface.style as ViewStyle | undefined}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                testID={`${baseTestID}-cancel`}
              >
                <Text
                  style={{
                    ...baseTextStyle,
                    ...(cancelLabelSurface.style as TextStyle | undefined),
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  )
}
