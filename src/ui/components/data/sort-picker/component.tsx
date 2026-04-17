import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal as RNModal,
  FlatList,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation, isFromRef, resolveFromRef } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { SortPickerConfig } from './types'

type SortOption = SortPickerConfig['options'][number]

export function SortPicker({ config }: { config: SortPickerConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const isOpen = Boolean(getValue(`__sortPicker_${config.id}`))
  const resolvedValue = useMemo(() => {
    if (isFromRef(config.value)) {
      const resolved = resolveFromRef(config.value, values)
      return typeof resolved === 'string' ? resolved : undefined
    }
    return typeof config.value === 'string' ? config.value : undefined
  }, [config.value, values])
  const [selected, setSelected] = useState(resolvedValue ?? config.defaultValue ?? '')

  useEffect(() => {
    if (resolvedValue !== undefined) {
      setSelected(resolvedValue)
    }
  }, [resolvedValue])

  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(300)).current
  const baseTestID = config.testID ?? config.id

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, opacity, translateY])

  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'muted',
      textAlign: 'center',
    },
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'border',
    },
    componentSurface: config.slots?.divider as Record<string, unknown> | undefined,
  })
  const optionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'md',
      gap: 'sm',
      states: {
        selected: {
          bg: 'accent',
        },
      },
    },
    componentSurface: config.slots?.option as Record<string, unknown> | undefined,
  })
  const optionLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
      states: {
        selected: {
          color: 'primary',
          fontWeight: 'semibold',
        },
      },
    },
    componentSurface: config.slots?.optionLabel as Record<string, unknown> | undefined,
  })
  const optionIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: 'muted',
    },
    componentSurface: config.slots?.optionIcon as Record<string, unknown> | undefined,
  })
  const checkmarkSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: 'primary',
      fontWeight: 'bold',
    },
    componentSurface: config.slots?.checkmark as Record<string, unknown> | undefined,
  })
  const cancelButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.cancelButton as Record<string, unknown> | undefined,
  })
  const cancelLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: 'foreground',
      textAlign: 'center',
    },
    componentSurface: config.slots?.cancelLabel as Record<string, unknown> | undefined,
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

  const handleClose = useCallback(() => {
    setValue(`__sortPicker_${config.id}`, false)
  }, [config.id, setValue])

  const handleSelect = useCallback(
    async (option: SortOption) => {
      setSelected(option.value)
      if (config.id) {
        setValue(config.id, option.value)
      }
      handleClose()
      await dispatch(config.onSelect)
    },
    [config.id, config.onSelect, dispatch, handleClose, setValue],
  )

  const renderItem = useCallback(
    ({ item }: { item: SortOption }) => {
      const isSelected = item.value === selected
      const activeStates: RuntimeSurfaceState[] | undefined = isSelected ? ['selected'] : undefined

      return (
        <TouchableOpacity
          onPress={() => void handleSelect(item)}
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

  const keyExtractor = useCallback((item: SortOption) => item.value, [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Dismiss">
          <Animated.View
            style={[
              {
                flex: 1,
                justifyContent: 'flex-end',
              },
              backdropSurface.style as ViewStyle | undefined,
              { opacity },
            ]}
          >
            <TouchableWithoutFeedback>
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
                <View
                  style={[
                    { height: 1 },
                    dividerSurface.style as ViewStyle | undefined,
                  ]}
                />

                <FlatList
                  data={config.options}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />

                <TouchableOpacity
                  onPress={handleClose}
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
    </ComponentWrapper>
  )
}
