import React, { useEffect, useRef, useState } from 'react'
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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { ActionSheetConfig, ActionSheetPayload } from './types'

export function ActionSheet({ config }: { config: ActionSheetConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()

  const [activeSheet, setActiveSheet] = useState<ActionSheetPayload | null>(null)
  const translateY = useRef(new Animated.Value(300)).current
  const opacity = useRef(new Animated.Value(0)).current
  const sheetPayload = getValue('__actionSheet') as ActionSheetPayload | undefined
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    if (!sheetPayload) return
    setActiveSheet(sheetPayload)

    translateY.setValue(300)
    opacity.setValue(0)

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [sheetPayload, translateY, opacity])

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      justifyContent: 'end',
      bg: 'rgba(0,0,0,0.55)',
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
  })
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderRadius: 'lg',
      shadow: 'xl',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
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
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.option as Record<string, unknown> | undefined,
  })
  const optionTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
      textAlign: 'center',
    },
    componentSurface: config.slots?.optionText as Record<string, unknown> | undefined,
  })
  const cancelSeparatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'background',
      height: tokens.spacing[2],
    },
    componentSurface: config.slots?.cancelSeparator as Record<string, unknown> | undefined,
  })
  const cancelOptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.cancelOption as Record<string, unknown> | undefined,
  })
  const cancelTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: 'foreground',
      textAlign: 'center',
    },
    componentSurface: config.slots?.cancelText as Record<string, unknown> | undefined,
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

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setValue('__actionSheet', null)
      setActiveSheet(null)
    })
  }

  function handleOption(action: ActionSheetPayload['options'][number]['action']) {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setValue('__actionSheet', null)
      setActiveSheet(null)
      void dispatch(action)
    })
  }

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeSheet ? ['open'] : undefined}
    >
      <Modal
        visible={activeSheet != null}
        transparent
        animationType="none"
        onRequestClose={dismiss}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={dismiss} accessibilityLabel="Dismiss">
          <Animated.View
            style={[
              {
                flex: 1,
                opacity,
              },
              backdropSurface.style as ViewStyle | undefined,
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  {
                    paddingBottom: tokens.spacing[8],
                    transform: [{ translateY }],
                  },
                  containerSurface.style as ViewStyle | undefined,
                ]}
              >
                {activeSheet?.title != null ? (
                  <>
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(titleSurface.style as TextStyle | undefined),
                      }}
                      accessibilityRole="header"
                    >
                      {activeSheet.title}
                    </Text>
                    <View
                      style={[
                        { height: 1, marginBottom: tokens.spacing[2] },
                        dividerSurface.style as ViewStyle | undefined,
                      ]}
                    />
                  </>
                ) : null}

                {activeSheet?.options.map((option, index) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      optionSurface.style as ViewStyle | undefined,
                      index < activeSheet.options.length - 1
                        ? { borderBottomWidth: 1, borderBottomColor: tokens.colors.divider }
                        : null,
                    ]}
                    onPress={() => handleOption(option.action)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    testID={`action-sheet-option-${index}`}
                  >
                    <Text
                      style={{
                        ...baseTextStyle,
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
                  accessibilityLabel="Cancel"
                  testID="action-sheet-cancel"
                >
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(cancelTextSurface.style as TextStyle | undefined),
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </ComponentWrapper>
  )
}
