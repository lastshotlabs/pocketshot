import React, { useEffect, useMemo, useRef, type ReactNode } from 'react'
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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { ModalConfig } from './types'

const WINDOW_WIDTH = Dimensions.get('window').width

const SIZE_MAP: Record<NonNullable<ModalConfig['size']>, number | 'full'> = {
  sm: 280,
  md: 360,
  lg: 480,
  full: 'full',
}

export interface ModalProps {
  config: ModalConfig
  children?: ReactNode
}

export function Modal({ config, children }: ModalProps) {
  const tokens = useTokens()
  const { getValue, setValue } = useScreenContext()

  const isOpen = Boolean(getValue(`__modal_${config.id}`))
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()
  }, [isOpen, opacity, scale])

  function handleClose() {
    setValue(`__modal_${config.id}`, false)
  }

  const size = config.size ?? 'md'
  const showCloseButton = config.showCloseButton ?? true
  const width = SIZE_MAP[size]
  const contentWidth = width === 'full' ? WINDOW_WIDTH - tokens.spacing[8] : (width as number)

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      justifyContent: 'center',
      bg: 'rgba(0,0,0,0.55)',
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.contentWrapper as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
    },
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const closeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: 'full',
      padding: 'xs',
    },
    componentSurface: config.slots?.closeButton as Record<string, unknown> | undefined,
  })
  const closeButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: 'muted',
    },
    componentSurface: config.slots?.closeButtonText as Record<string, unknown> | undefined,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'border',
    },
    componentSurface: config.slots?.divider as Record<string, unknown> | undefined,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'md',
    },
    componentSurface: config.slots?.body as Record<string, unknown> | undefined,
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
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback
          onPress={config.closeOnBackdrop ? handleClose : undefined}
          accessibilityLabel="Close modal"
        >
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
                  contentWrapperSurface.style as ViewStyle | undefined,
                  { transform: [{ scale }] },
                ]}
              >
                {(config.title != null || showCloseButton) ? (
                  <>
                    <View style={headerSurface.style as ViewStyle | undefined}>
                      {config.title != null ? (
                        <Text
                          style={{
                            ...baseTextStyle,
                            flex: 1,
                            ...(titleSurface.style as TextStyle | undefined),
                          }}
                          accessibilityRole="header"
                        >
                          {config.title}
                        </Text>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                      {showCloseButton ? (
                        <TouchableOpacity
                          onPress={handleClose}
                          style={closeButtonSurface.style as ViewStyle | undefined}
                          accessibilityLabel="Close"
                          accessibilityRole="button"
                          testID={config.testID ? `${config.testID}-close` : `${config.id}-close`}
                        >
                          <Text
                            style={{
                              ...baseTextStyle,
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
    </ComponentWrapper>
  )
}
