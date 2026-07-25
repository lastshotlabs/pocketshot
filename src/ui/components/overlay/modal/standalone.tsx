import React, { useEffect, useRef, type ReactNode } from 'react'
import {
  Animated,
  Dimensions,
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

const WINDOW_WIDTH = Dimensions.get('window').width

export type ModalSize = 'sm' | 'md' | 'lg' | 'full'

const SIZE_MAP: Record<ModalSize, number | 'full'> = {
  sm: 280,
  md: 360,
  lg: 480,
  full: 'full',
}

export interface ModalBaseProps {
  /** Whether the modal is visible. */
  visible: boolean
  /** Called when the modal should close (backdrop press, close button, hardware back). */
  onClose: () => void
  /** Modal title shown in header. */
  title?: string
  /** Modal size variant. */
  size?: ModalSize
  /** Show built-in close button in the header. Default true. */
  showCloseButton?: boolean
  /** Close when backdrop pressed. Default false. */
  closeOnBackdrop?: boolean
  /** Style applied to the modal panel. */
  style?: ViewStyle
  /** Slot overrides (backdrop, contentWrapper, header, title, closeButton, closeButtonText, divider, body). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
  children?: ReactNode
}

/**
 * Standalone Modal — plain React props, no manifest required.
 *
 * @example
 * <ModalBase visible={open} onClose={() => setOpen(false)} title="Hi">
 *   <Text>Body</Text>
 * </ModalBase>
 */
export function ModalBase({
  visible,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = false,
  style,
  slots,
  testID,
  id,
  children,
}: ModalBaseProps) {
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

  const width = SIZE_MAP[size]
  const contentWidth = width === 'full' ? WINDOW_WIDTH - tokens.spacing[8] : (width as number)

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      justifyContent: 'center',
      bg: 'rgba(0,0,0,0.55)',
    },
    componentSurface: slots?.backdrop,
  })
  const contentWrapperSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderRadius: 'lg',
      shadow: 'xl',
      overflow: 'hidden',
      width: contentWidth,
    },
    componentSurface: slots?.contentWrapper,
  })
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
    implementationBase: { fontSize: 'lg', fontWeight: 'semibold', color: 'foreground' },
    componentSurface: slots?.title,
  })
  const closeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { borderRadius: 'full', padding: 'xs' },
    componentSurface: slots?.closeButton,
  })
  const closeButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'lg', color: 'muted' },
    componentSurface: slots?.closeButtonText,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border' },
    componentSurface: slots?.divider,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { padding: 'md' },
    componentSurface: slots?.body,
  })

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
      testID={testID ?? id}
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdrop ? onClose : undefined}
        accessibilityLabel="Close modal"
      >
        <Animated.View
          style={[{ flex: 1, opacity }, backdropSurface.style as ViewStyle | undefined]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                contentWrapperSurface.style as ViewStyle | undefined,
                { transform: [{ scale }] },
                style,
              ]}
            >
              {title != null || showCloseButton ? (
                <>
                  <View style={headerSurface.style as ViewStyle | undefined}>
                    {title != null ? (
                      <Text
                        style={{
                          ...sharedTextStyle,
                          flex: 1,
                          ...(titleSurface.style as TextStyle | undefined),
                        }}
                        accessibilityRole="header"
                      >
                        {title}
                      </Text>
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                    {showCloseButton ? (
                      <TouchableOpacity
                        onPress={onClose}
                        style={closeButtonSurface.style as ViewStyle | undefined}
                        accessibilityLabel="Close"
                        accessibilityRole="button"
                        testID={testID ? `${testID}-close` : id ? `${id}-close` : undefined}
                      >
                        <Text
                          style={{
                            ...sharedTextStyle,
                            ...(closeButtonTextSurface.style as TextStyle | undefined),
                          }}
                        >
                          X
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View
                    style={[
                      { height: 1, marginHorizontal: tokens.spacing[4] },
                      dividerSurface.style as ViewStyle | undefined,
                    ]}
                  />
                </>
              ) : null}
              <View style={bodySurface.style as ViewStyle | undefined}>{children}</View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  )
}
