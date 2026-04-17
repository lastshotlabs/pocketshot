import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { PopoverConfig } from './types'

function containerPositionStyle(position: PopoverConfig['position'], spacing: number): ViewStyle {
  switch (position) {
    case 'top':
      return { justifyContent: 'flex-start', paddingTop: spacing * 6, alignItems: 'center' }
    case 'left':
      return { justifyContent: 'center', alignItems: 'flex-start', paddingLeft: spacing * 3 }
    case 'right':
      return { justifyContent: 'center', alignItems: 'flex-end', paddingRight: spacing * 3 }
    case 'bottom':
    default:
      return { justifyContent: 'flex-end', paddingBottom: spacing * 6, alignItems: 'center' }
  }
}

export function Popover({ config }: { config: PopoverConfig }) {
  const tokens = useTokens()
  const { setValue } = useScreenContext()
  const [visible, setVisible] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

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

  const triggerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      bg: 'popover',
      border: '1px solid border',
      borderRadius: 'md',
      paddingX: 'md',
      paddingY: 'sm',
      gap: 'xs',
    },
    componentSurface: config.slots?.trigger as Record<string, unknown> | undefined,
  })
  const triggerIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: config.slots?.triggerIcon as Record<string, unknown> | undefined,
  })
  const triggerLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: config.slots?.triggerLabel as Record<string, unknown> | undefined,
  })
  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'rgba(0,0,0,0.55)',
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
  })
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
      height: '100%',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderRadius: 'lg',
      padding: 'lg',
      shadow: 'xl',
      maxWidth: 300,
      width: '85%',
    },
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      marginY: 'xs',
    },
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
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
  const closeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.closeText as Record<string, unknown> | undefined,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.content as Record<string, unknown> | undefined,
  })

  const openPopover = useCallback(() => {
    setVisible(true)
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [opacity])

  const closePopover = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => setVisible(false))
  }, [opacity])

  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, setValue, visible])

  const handleBackdropPress = useCallback(() => {
    if (config.closeOnBackdrop ?? true) {
      closePopover()
    }
  }, [closePopover, config.closeOnBackdrop])

  const triggerTestID = config.testID ? `${config.testID}-trigger` : `${config.id}-trigger`
  const closeTestID = config.testID ? `${config.testID}-close` : `${config.id}-close`
  const positionStyle = useMemo(
    () => containerPositionStyle(config.position, tokens.spacing[2]),
    [config.position, tokens.spacing],
  )

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={visible ? ['open'] : undefined}
    >
      <TouchableOpacity
        onPress={openPopover}
        style={triggerSurface.style as ViewStyle | undefined}
        accessibilityRole="button"
        accessibilityState={{ expanded: visible }}
        accessibilityLabel={`${config.triggerLabel} - press to open popover`}
        testID={triggerTestID}
        activeOpacity={0.75}
      >
        {config.triggerIcon != null ? (
          <Text
            style={{
              ...baseTextStyle,
              marginRight: tokens.spacing[1],
              ...(triggerIconSurface.style as TextStyle | undefined),
            }}
            accessibilityElementsHidden
          >
            {config.triggerIcon}
          </Text>
        ) : null}
        <Text
          style={{
            ...baseTextStyle,
            ...(triggerLabelSurface.style as TextStyle | undefined),
          }}
        >
          {config.triggerLabel}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closePopover}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress} accessibilityLabel="Close popover">
          <Animated.View
            style={[
              { flex: 1 },
              backdropSurface.style as ViewStyle | undefined,
              { opacity },
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  containerSurface.style as ViewStyle | undefined,
                  positionStyle,
                ]}
              >
                <View style={panelSurface.style as ViewStyle | undefined}>
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
                    <TouchableOpacity
                      onPress={closePopover}
                      style={closeButtonSurface.style as ViewStyle | undefined}
                      accessibilityLabel="Close popover"
                      accessibilityRole="button"
                      testID={closeTestID}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text
                        style={{
                          ...baseTextStyle,
                          ...(closeTextSurface.style as TextStyle | undefined),
                        }}
                      >
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(contentSurface.style as TextStyle | undefined),
                    }}
                  >
                    {config.content}
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </ComponentWrapper>
  )
}
