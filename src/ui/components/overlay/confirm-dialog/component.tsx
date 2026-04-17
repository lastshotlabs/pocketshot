import React, { useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal as RNModal,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { ConfirmDialogConfig } from './types'

export function ConfirmDialog({ config }: { config: ConfirmDialogConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()
  const isOpen = Boolean(getValue(`__confirm_${config.id}`))
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start()
  }, [isOpen, opacity, scale])

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
      borderRadius: 'lg',
      shadow: 'xl',
      overflow: 'hidden',
      width: 300,
    },
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'xl',
    },
    componentSurface: config.slots?.body as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
      marginY: 'xs',
    },
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const messageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.message as Record<string, unknown> | undefined,
  })
  const buttonRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      border: '1px solid border',
    },
    componentSurface: config.slots?.buttonRow as Record<string, unknown> | undefined,
  })
  const cancelButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'md',
      border: '1px solid border',
    },
    componentSurface: config.slots?.cancelButton as Record<string, unknown> | undefined,
  })
  const cancelTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'medium',
      color: 'muted',
    },
    componentSurface: config.slots?.cancelText as Record<string, unknown> | undefined,
  })
  const confirmButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'md',
    },
    componentSurface: config.slots?.confirmButton as Record<string, unknown> | undefined,
  })
  const confirmTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase:
      config.variant === 'destructive'
        ? {
            fontSize: 'base',
            fontWeight: 'semibold',
            color: 'destructive',
          }
        : {
            fontSize: 'base',
            fontWeight: 'semibold',
            color: 'primary',
          },
    componentSurface: config.slots?.confirmText as Record<string, unknown> | undefined,
  })

  const handleClose = useCallback(() => {
    setValue(`__confirm_${config.id}`, false)
  }, [config.id, setValue])

  const handleCancel = useCallback(async () => {
    handleClose()
    if (config.onCancel) {
      await dispatch(config.onCancel)
    }
  }, [config.onCancel, dispatch, handleClose])

  const handleConfirm = useCallback(async () => {
    handleClose()
    await dispatch(config.onConfirm)
  }, [config.onConfirm, dispatch, handleClose])

  const confirmLabel = config.confirmLabel ?? 'Confirm'
  const cancelLabel = config.cancelLabel ?? 'Cancel'
  const baseTestID = config.testID ?? config.id

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleCancel}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleCancel} accessibilityLabel="Dismiss">
          <Animated.View
            style={[
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              },
              backdropSurface.style as ViewStyle | undefined,
              { opacity },
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  panelSurface.style as ViewStyle | undefined,
                  { transform: [{ scale }] },
                ]}
              >
                <View style={bodySurface.style as ViewStyle | undefined}>
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(titleSurface.style as TextStyle | undefined),
                    }}
                    accessibilityRole="header"
                    testID={`${baseTestID}-title`}
                  >
                    {config.title}
                  </Text>
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(messageSurface.style as TextStyle | undefined),
                    }}
                    testID={`${baseTestID}-message`}
                  >
                    {config.message}
                  </Text>
                </View>

                <View style={buttonRowSurface.style as ViewStyle | undefined}>
                  <TouchableOpacity
                    onPress={() => void handleCancel()}
                    style={cancelButtonSurface.style as ViewStyle | undefined}
                    accessibilityRole="button"
                    accessibilityLabel={cancelLabel}
                    testID={`${baseTestID}-cancel`}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(cancelTextSurface.style as TextStyle | undefined),
                      }}
                    >
                      {cancelLabel}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => void handleConfirm()}
                    style={confirmButtonSurface.style as ViewStyle | undefined}
                    accessibilityRole="button"
                    accessibilityLabel={confirmLabel}
                    testID={`${baseTestID}-confirm`}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(confirmTextSurface.style as TextStyle | undefined),
                      }}
                    >
                      {confirmLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    </ComponentWrapper>
  )
}
