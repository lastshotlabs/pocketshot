import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal,
  FlatList,
  Dimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { ContextMenuConfig } from './types'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

function triggerHaptic() {
  try {
    const Haptics = require('expo-haptics')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch {
    // no-op
  }
}

export interface ContextMenuProps {
  config: ContextMenuConfig
  children?: ReactNode
}

export function ContextMenu({ config, children }: ContextMenuProps) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [visible, setVisible] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null)
  const triggerRef = useRef<View>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.9)).current
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

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      border: '1px solid border',
      borderRadius: 'md',
      minWidth: 180,
      shadow: 'xl',
      overflow: 'hidden',
    },
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
  })
  const itemSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'lg',
      paddingY: 'md',
      gap: 'sm',
      states: {
        disabled: {
          opacity: 0.4,
        },
      },
    },
    componentSurface: config.slots?.item as Record<string, unknown> | undefined,
  })
  const itemIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: config.slots?.itemIcon as Record<string, unknown> | undefined,
  })
  const itemLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'foreground',
    },
    componentSurface: config.slots?.itemLabel as Record<string, unknown> | undefined,
  })
  const separatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'border',
    },
    componentSurface: config.slots?.separator as Record<string, unknown> | undefined,
  })

  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }),
    ]).start()
  }, [opacity, scale])

  const animateClose = useCallback(
    (onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 120, useNativeDriver: true }),
      ]).start(onDone)
    },
    [opacity, scale],
  )

  const handleLongPress = useCallback(() => {
    triggerHaptic()
    const node = triggerRef.current as View & {
      measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void
    }

    if (!node?.measureInWindow) {
      setTriggerLayout({ x: 8, y: 8, width: 180, height: 32 })
      setVisible(true)
      return
    }

    node.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height })
      setVisible(true)
    })
  }, [])

  useEffect(() => {
    if (visible) {
      animateOpen()
    }
  }, [animateOpen, visible])

  const closeMenu = useCallback(() => {
    animateClose(() => setVisible(false))
  }, [animateClose])

  const handleItemPress = useCallback(
    async (item: ContextMenuConfig['items'][number]) => {
      closeMenu()
      await dispatch(item.onPress)
    },
    [closeMenu, dispatch],
  )

  const panelPositionStyle = useMemo(() => {
    if (!triggerLayout) return {}
    const panelTop = triggerLayout.y + triggerLayout.height + 4
    const panelLeft = triggerLayout.x
    return {
      top: Math.min(panelTop, SCREEN_HEIGHT - 200),
      left: Math.max(8, Math.min(panelLeft, SCREEN_WIDTH - 188)),
    }
  }, [triggerLayout])

  const triggerTestID = config.testID ?? config.id ?? 'context-menu'

  const renderItem = useCallback(
    ({ item, index }: { item: ContextMenuConfig['items'][number]; index: number }) => {
      const activeStates: RuntimeSurfaceState[] | undefined = item.disabled ? ['disabled'] : undefined
      const destructiveColor = item.destructive ? tokens.colors.destructive : undefined
      const rowStyle = resolveSurfacePresentation({
        tokens,
        implementationBase: itemSurface.resolvedConfigForWrapper,
        activeStates,
      }).style as ViewStyle | undefined

      return (
        <View key={item.id}>
          <TouchableOpacity
            onPress={() => void (!item.disabled && handleItemPress(item))}
            style={rowStyle}
            disabled={item.disabled}
            accessibilityRole="menuitem"
            accessibilityLabel={item.label}
            accessibilityState={{ disabled: item.disabled }}
            testID={`context-menu-item-${item.id}`}
            activeOpacity={0.7}
          >
            {item.icon != null ? (
              <Text
                style={{
                  ...baseTextStyle,
                  width: 20,
                  textAlign: 'center',
                  color: destructiveColor ?? undefined,
                  ...(itemIconSurface.style as TextStyle | undefined),
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
                color: destructiveColor ?? undefined,
                ...(itemLabelSurface.style as TextStyle | undefined),
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
          {index < config.items.length - 1 ? (
            <View
              style={[
                { height: 1, marginHorizontal: tokens.spacing[3] },
                separatorSurface.style as ViewStyle | undefined,
              ]}
            />
          ) : null}
        </View>
      )
    },
    [
      baseTextStyle,
      config.items.length,
      handleItemPress,
      itemIconSurface.style,
      itemLabelSurface.style,
      itemSurface.resolvedConfigForWrapper,
      separatorSurface.style,
      tokens,
    ],
  )

  const keyExtractor = useCallback((item: ContextMenuConfig['items'][number]) => item.id, [])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={visible ? ['open'] : undefined}
    >
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={500}
          accessibilityRole="button"
          accessibilityLabel={config.triggerLabel ?? 'Long press for options'}
          accessibilityHint="Long press to open context menu"
          testID={`${triggerTestID}-trigger`}
        >
          {children}
        </Pressable>
      </View>

      {visible ? (
        <Modal
          visible={visible}
          transparent
          animationType="none"
          onRequestClose={closeMenu}
          statusBarTranslucent
        >
          <TouchableWithoutFeedback onPress={closeMenu} accessibilityLabel="Close menu">
            <View style={backdropSurface.style as ViewStyle | undefined} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              {
                position: 'absolute',
                opacity,
                transform: [{ scale }],
              },
              panelSurface.style as ViewStyle | undefined,
              panelPositionStyle,
            ]}
            accessibilityRole="menu"
            accessibilityLabel="Context menu"
          >
            <FlatList
              data={config.items}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          </Animated.View>
        </Modal>
      ) : null}
    </ComponentWrapper>
  )
}
