import React, { useEffect, useRef } from 'react'
import {
  Animated,
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
import { useTokens } from '../../../context/AppContext'

export type ConfirmDialogVariant = 'default' | 'destructive'

export interface ConfirmDialogBaseProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel?: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone ConfirmDialog — plain React props, no manifest required.
 *
 * @example
 * <ConfirmDialogBase
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   onConfirm={() => del()}
 *   title="Delete?"
 *   message="This cannot be undone."
 *   variant="destructive"
 * />
 */
export function ConfirmDialogBase({
  visible,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  style,
  slots,
  testID,
  id,
}: ConfirmDialogBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, opacity, scale])

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
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
    componentSurface: slots?.panel,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { padding: 'xl' },
    componentSurface: slots?.body,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
      marginY: 'xs',
    },
    componentSurface: slots?.title,
  })
  const messageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.message,
  })
  const buttonRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', border: '1px solid border' },
    componentSurface: slots?.buttonRow,
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
    componentSurface: slots?.cancelButton,
  })
  const cancelTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', fontWeight: 'medium', color: 'muted' },
    componentSurface: slots?.cancelText,
  })
  const confirmButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingY: 'md' },
    componentSurface: slots?.confirmButton,
  })
  const confirmTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase:
      variant === 'destructive'
        ? { fontSize: 'base', fontWeight: 'semibold', color: 'destructive' }
        : { fontSize: 'base', fontWeight: 'semibold', color: 'primary' },
    componentSurface: slots?.confirmText,
  })

  const handleCancel = () => {
    onClose()
    onCancel?.()
  }
  const handleConfirm = () => {
    onClose()
    onConfirm()
  }

  const baseTestID = testID ?? id

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
      accessibilityViewIsModal
      testID={baseTestID}
    >
      <TouchableWithoutFeedback onPress={handleCancel} accessibilityLabel="Dismiss">
        <Animated.View
          style={[
            { flex: 1, alignItems: 'center', justifyContent: 'center' },
            backdropSurface.style as ViewStyle | undefined,
            { opacity },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                panelSurface.style as ViewStyle | undefined,
                { transform: [{ scale }] },
                style,
              ]}
            >
              <View style={bodySurface.style as ViewStyle | undefined}>
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(titleSurface.style as TextStyle | undefined),
                  }}
                  accessibilityRole="header"
                  testID={baseTestID ? `${baseTestID}-title` : undefined}
                >
                  {title}
                </Text>
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(messageSurface.style as TextStyle | undefined),
                  }}
                  testID={baseTestID ? `${baseTestID}-message` : undefined}
                >
                  {message}
                </Text>
              </View>
              <View style={buttonRowSurface.style as ViewStyle | undefined}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={cancelButtonSurface.style as ViewStyle | undefined}
                  accessibilityRole="button"
                  accessibilityLabel={cancelLabel}
                  testID={baseTestID ? `${baseTestID}-cancel` : undefined}
                  activeOpacity={0.7}
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
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={confirmButtonSurface.style as ViewStyle | undefined}
                  accessibilityRole="button"
                  accessibilityLabel={confirmLabel}
                  testID={baseTestID ? `${baseTestID}-confirm` : undefined}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      ...sharedTextStyle,
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
  )
}
