import React, { useEffect, useMemo, useRef, useState } from 'react'
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

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right'

function containerPositionStyle(position: PopoverPosition, spacing: number): ViewStyle {
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

export interface PopoverBaseProps {
  /** Trigger label text (rendered on the trigger button). */
  triggerLabel: string
  /** Optional icon glyph for the trigger. */
  triggerIcon?: string
  /** Title rendered in popover header. */
  title?: string
  /** Body text content. */
  content: string
  /** Position relative to viewport. */
  position?: PopoverPosition
  /** Tap on backdrop closes. Default true. */
  closeOnBackdrop?: boolean
  /** Optional callback when popover open state changes. */
  onOpenChange?: (open: boolean) => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone Popover — plain React props, no manifest required.
 *
 * @example
 * <PopoverBase triggerLabel="More" content="Hello" position="bottom" />
 */
export function PopoverBase({
  triggerLabel,
  triggerIcon,
  title,
  content,
  position = 'bottom',
  closeOnBackdrop = true,
  onOpenChange,
  style,
  slots,
  testID,
  id,
}: PopoverBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [visible, setVisible] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    onOpenChange?.(visible)
  }, [visible, onOpenChange])

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
    componentSurface: slots?.trigger,
  })
  const triggerIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'foreground' },
    componentSurface: slots?.triggerIcon,
  })
  const triggerLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'medium', color: 'foreground' },
    componentSurface: slots?.triggerLabel,
  })
  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
  })
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: '100%', height: '100%' },
    componentSurface: slots?.container,
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
    componentSurface: slots?.panel,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      marginY: 'xs',
    },
    componentSurface: slots?.header,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', fontWeight: 'semibold', color: 'foreground' },
    componentSurface: slots?.title,
  })
  const closeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { borderRadius: 'full', padding: 'xs' },
    componentSurface: slots?.closeButton,
  })
  const closeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.closeText,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.content,
  })

  const openPopover = () => {
    setVisible(true)
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start()
  }
  const closePopover = () => {
    Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(() =>
      setVisible(false),
    )
  }
  const handleBackdropPress = () => {
    if (closeOnBackdrop) closePopover()
  }

  const triggerTestID = testID ? `${testID}-trigger` : id ? `${id}-trigger` : undefined
  const closeTestID = testID ? `${testID}-close` : id ? `${id}-close` : undefined
  const positionStyle = useMemo(
    () => containerPositionStyle(position, tokens.spacing[2]),
    [position, tokens.spacing],
  )

  return (
    <View style={style} testID={testID ?? id}>
      <TouchableOpacity
        onPress={openPopover}
        style={triggerSurface.style as ViewStyle | undefined}
        accessibilityRole="button"
        accessibilityState={{ expanded: visible }}
        accessibilityLabel={`${triggerLabel} - press to open popover`}
        testID={triggerTestID}
        activeOpacity={0.75}
      >
        {triggerIcon != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              marginRight: tokens.spacing[1],
              ...(triggerIconSurface.style as TextStyle | undefined),
            }}
            accessibilityElementsHidden
          >
            {triggerIcon}
          </Text>
        ) : null}
        <Text
          style={{
            ...sharedTextStyle,
            ...(triggerLabelSurface.style as TextStyle | undefined),
          }}
        >
          {triggerLabel}
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
                          ...sharedTextStyle,
                          ...(closeTextSurface.style as TextStyle | undefined),
                        }}
                      >
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      ...sharedTextStyle,
                      ...(contentSurface.style as TextStyle | undefined),
                    }}
                  >
                    {content}
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  )
}
