import React, { useEffect, useRef, useState, type ReactNode } from 'react'
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
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

const ANIMATION_DURATION = 280

export type DrawerPosition = 'left' | 'right'

export interface DrawerBaseProps {
  visible: boolean
  onClose: () => void
  title?: string
  /** Drawer side. */
  position?: DrawerPosition
  /** Width as percent of screen (1-100). Default 80. */
  widthPercent?: number
  /** Show a top handle. Default true. */
  showHandle?: boolean
  /** Tap on backdrop closes drawer. Default true. */
  closeOnBackdrop?: boolean
  /** Optional fallback string content. */
  content?: string
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
  children?: ReactNode
}

/**
 * Standalone Drawer — plain React props, no manifest required.
 *
 * @example
 * <DrawerBase visible={open} onClose={() => setOpen(false)} title="Menu">
 *   <Text>Body</Text>
 * </DrawerBase>
 */
export function DrawerBase({
  visible,
  onClose,
  title,
  position = 'left',
  widthPercent = 80,
  showHandle = true,
  closeOnBackdrop = true,
  content,
  style,
  slots,
  testID,
  id,
  children,
}: DrawerBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const screenWidth = Dimensions.get('window').width
  const drawerWidth = (screenWidth * widthPercent) / 100
  const hiddenX = position === 'left' ? -drawerWidth : drawerWidth

  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (visible) setIsVisible(true)
  }, [visible])

  const translateX = useRef(new Animated.Value(hiddenX)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : hiddenX,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 0.5 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!visible) setIsVisible(false)
    })
  }, [visible, translateX, backdropOpacity, hiddenX])

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
    implementationBase: { bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'card', shadow: 'xl', overflow: 'hidden' },
    componentSurface: slots?.panel,
  })
  const handleContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { alignItems: 'center', paddingTop: 'sm', paddingBottom: 'xs' },
    componentSurface: slots?.handleContainer,
  })
  const handleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: 40, height: 4, bg: 'border', borderRadius: 'full' },
    componentSurface: slots?.handle,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingTop: 'md', paddingBottom: 'sm' },
    componentSurface: slots?.header,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'lg', fontWeight: 'semibold', color: 'foreground' },
    componentSurface: slots?.title,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border' },
    componentSurface: slots?.divider,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, padding: 'md' },
    componentSurface: slots?.body,
  })
  const bodyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', lineHeight: 'normal' },
    componentSurface: slots?.bodyText,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.content,
  })

  return (
    <Modal
      transparent
      animationType="none"
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
      testID={testID ?? id}
    >
      <View style={fillStyle}>
        <TouchableWithoutFeedback
          onPress={closeOnBackdrop ? onClose : undefined}
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
            style,
          ]}
          testID={testID ? `${testID}-panel` : id ? `drawer-${id}-panel` : undefined}
        >
          {showHandle && (
            <View style={handleContainerSurface.style as ViewStyle | undefined}>
              <View style={handleSurface.style as ViewStyle | undefined} />
            </View>
          )}
          {title != null && (
            <>
              <View style={headerSurface.style as ViewStyle | undefined}>
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(titleSurface.style as TextStyle | undefined),
                  }}
                  accessibilityRole="header"
                  testID={testID ? `${testID}-title` : id ? `drawer-${id}-title` : undefined}
                >
                  {title}
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
            {content != null ? (
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(bodyTextSurface.style as TextStyle | undefined),
                }}
              >
                {content}
              </Text>
            ) : null}
            {children != null ? (
              <View style={contentSurface.style as ViewStyle | undefined}>{children}</View>
            ) : content == null ? (
              <View style={contentSurface.style as ViewStyle | undefined} />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}
