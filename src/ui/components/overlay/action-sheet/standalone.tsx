import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface ActionSheetOption {
  label: string
  destructive?: boolean
  onPress?: () => void
}

export interface ActionSheetBaseProps {
  /** Whether the sheet is visible. */
  visible: boolean
  /** Called when sheet should close (cancel pressed, backdrop tapped, etc). */
  onClose: () => void
  /** Sheet title rendered above options. */
  title?: string
  /** Options to render. */
  options?: ActionSheetOption[]
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string
  /** Style applied to root. */
  style?: ViewStyle
  /** Slot overrides (backdrop, container, title, divider, option, optionText, cancelSeparator, cancelOption, cancelText). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone ActionSheet — plain React props, no manifest required.
 *
 * @example
 * <ActionSheetBase
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   title="Choose"
 *   options={[
 *     { label: 'Edit', onPress: () => edit() },
 *     { label: 'Delete', destructive: true, onPress: () => del() },
 *   ]}
 * />
 */
export function ActionSheetBase({
  visible,
  onClose,
  title,
  options = [],
  cancelLabel = 'Cancel',
  style,
  slots,
  testID,
  id,
}: ActionSheetBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const translateY = useRef(new Animated.Value(300)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      translateY.setValue(300)
      opacity.setValue(0)
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, translateY, opacity])

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { justifyContent: 'end', bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
  })
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'card', borderRadius: 'lg', shadow: 'xl' },
    componentSurface: slots?.container,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'muted',
      textAlign: 'center',
      paddingX: 'md',
      paddingY: 'md',
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
    implementationBase: { paddingX: 'md', paddingY: 'md' },
    componentSurface: slots?.option,
  })
  const optionTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'foreground', textAlign: 'center' },
    componentSurface: slots?.optionText,
  })
  const cancelSeparatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'background', height: tokens.spacing[2] },
    componentSurface: slots?.cancelSeparator,
  })
  const cancelOptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingY: 'md' },
    componentSurface: slots?.cancelOption,
  })
  const cancelTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: 'foreground',
      textAlign: 'center',
    },
    componentSurface: slots?.cancelText,
  })

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      onClose()
    })
  }

  function handleOption(option: ActionSheetOption) {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      onClose()
      option.onPress?.()
    })
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
      accessibilityViewIsModal
      testID={testID ?? id}
    >
      <TouchableWithoutFeedback onPress={dismiss} accessibilityLabel="Dismiss">
        <Animated.View
          style={[{ flex: 1, opacity }, backdropSurface.style as ViewStyle | undefined, style]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                { paddingBottom: tokens.spacing[8], transform: [{ translateY }] },
                containerSurface.style as ViewStyle | undefined,
              ]}
            >
              {title != null ? (
                <>
                  <Text
                    style={{ ...sharedTextStyle, ...(titleSurface.style as TextStyle | undefined) }}
                    accessibilityRole="header"
                  >
                    {title}
                  </Text>
                  <View
                    style={[
                      { height: 1, marginBottom: tokens.spacing[2] },
                      dividerSurface.style as ViewStyle | undefined,
                    ]}
                  />
                </>
              ) : null}
              {options.map((option, index) => (
                <TouchableOpacity
                  key={`${option.label}-${index}`}
                  style={[
                    optionSurface.style as ViewStyle | undefined,
                    index < options.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: tokens.colors.divider }
                      : null,
                  ]}
                  onPress={() => handleOption(option)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  testID={`action-sheet-option-${index}`}
                >
                  <Text
                    style={{
                      ...sharedTextStyle,
                      color: option.destructive ? tokens.colors.destructive : undefined,
                      ...(optionTextSurface.style as TextStyle | undefined),
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={cancelSeparatorSurface.style as ViewStyle | undefined} />
              <TouchableOpacity
                style={cancelOptionSurface.style as ViewStyle | undefined}
                onPress={dismiss}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
                testID="action-sheet-cancel"
              >
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(cancelTextSurface.style as TextStyle | undefined),
                  }}
                >
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
