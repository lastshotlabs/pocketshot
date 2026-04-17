import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  Text,
  TouchableWithoutFeedback,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DrawerConfig } from './types'

const ANIMATION_DURATION = 280

/**
 * Config-driven side drawer. Open/close via ScreenContext key `__drawer_{id}`.
 *
 * Slides in from the configured side (left or right) with an animated
 * translateX transition and a fade-in backdrop.
 *
 * Handles Android hardware back button via Modal's `onRequestClose`.
 */
export function Drawer({ config, children }: { config: DrawerConfig; children?: ReactNode }) {
  const tokens = useTokens()
  const { getValue, setValue } = useScreenContext()

  const position = config.position ?? 'left'
  const widthPercent = config.widthPercent ?? 80
  const showHandle = config.showHandle ?? true
  const closeOnBackdrop = config.closeOnBackdrop ?? true

  const screenWidth = Dimensions.get('window').width
  const drawerWidth = (screenWidth * widthPercent) / 100
  const hiddenX = position === 'left' ? -drawerWidth : drawerWidth

  const isOpen = Boolean(getValue(`__drawer_${config.id}`))

  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const translateX = useRef(new Animated.Value(hiddenX)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : hiddenX,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 0.5 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!isOpen) {
        setIsVisible(false)
      }
    })
  }, [isOpen, translateX, backdropOpacity, hiddenX, setIsVisible])

  const handleClose = useCallback(() => {
    setValue(`__drawer_${config.id}`, false)
  }, [setValue, config.id])

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

  const fillStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }

  const panelPositionStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: drawerWidth,
    ...(position === 'left' ? { left: 0 } : { right: 0 }),
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
      shadow: 'xl',
      overflow: 'hidden',
    },
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
  })
  const handleContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      paddingTop: 'sm',
      paddingBottom: 'xs',
    },
    componentSurface: config.slots?.handleContainer as Record<string, unknown> | undefined,
  })
  const handleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: 40,
      height: 4,
      bg: 'border',
      borderRadius: 'full',
    },
    componentSurface: config.slots?.handle as Record<string, unknown> | undefined,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingTop: 'md',
      paddingBottom: 'sm',
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
      flex: 1,
      padding: 'md',
    },
    componentSurface: config.slots?.body as Record<string, unknown> | undefined,
  })
  const bodyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      lineHeight: 'normal',
    },
    componentSurface: config.slots?.bodyText as Record<string, unknown> | undefined,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
    },
    componentSurface: config.slots?.content as Record<string, unknown> | undefined,
  })

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <Modal
        transparent
        animationType="none"
        visible={isVisible}
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <View style={fillStyle}>
          <TouchableWithoutFeedback
            onPress={closeOnBackdrop ? handleClose : undefined}
            accessibilityRole="none"
            accessibilityLabel="Close drawer"
          >
            <Animated.View
              style={[
                fillStyle,
                backdropSurface.style as ViewStyle | undefined,
                { opacity: backdropOpacity },
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              panelPositionStyle,
              panelSurface.style as ViewStyle | undefined,
              { transform: [{ translateX }] },
            ]}
            testID={config.testID ? `${config.testID}-panel` : `drawer-${config.id}-panel`}
          >
            {showHandle && (
              <View style={handleContainerSurface.style as ViewStyle | undefined}>
                <View style={handleSurface.style as ViewStyle | undefined} />
              </View>
            )}

            {config.title != null && (
              <>
                <View style={headerSurface.style as ViewStyle | undefined}>
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(titleSurface.style as TextStyle | undefined),
                    }}
                    accessibilityRole="header"
                    testID={config.testID ? `${config.testID}-title` : `drawer-${config.id}-title`}
                  >
                    {config.title}
                  </Text>
                </View>
                <View
                  style={[
                    { height: 1, marginHorizontal: tokens.spacing[4] },
                    dividerSurface.style as ViewStyle | undefined,
                  ]}
                />
              </>
            )}

            <View style={bodySurface.style as ViewStyle | undefined}>
              {config.content != null ? (
                <Text
                  style={{
                    ...baseTextStyle,
                    ...(bodyTextSurface.style as TextStyle | undefined),
                  }}
                >
                  {config.content}
                </Text>
              ) : null}
              {children != null ? (
                <View style={contentSurface.style as ViewStyle | undefined}>{children}</View>
              ) : config.content == null ? (
                <View style={contentSurface.style as ViewStyle | undefined} />
              ) : null}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ComponentWrapper>
  )
}
