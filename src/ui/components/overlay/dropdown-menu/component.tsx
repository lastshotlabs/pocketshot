import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
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
import type { DropdownMenuConfig } from './types'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

export function DropdownMenu({ config }: { config: DropdownMenuConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [visible, setVisible] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null)
  const triggerRef = useRef<View>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-4)).current
  const chevronRotation = useRef(new Animated.Value(0)).current
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
      bg: 'card',
      border: '1px solid border',
      borderRadius: 'md',
      paddingX: 'md',
      paddingY: 'sm',
      gap: 'sm',
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
  const chevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
    },
    componentSurface: config.slots?.chevron as Record<string, unknown> | undefined,
  })
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
      minWidth: 160,
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
      paddingX: 'md',
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
      Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(chevronRotation, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start()
  }, [chevronRotation, opacity, translateY])

  const animateClose = useCallback(
    (onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -4, duration: 120, useNativeDriver: true }),
        Animated.timing(chevronRotation, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(onDone)
    },
    [chevronRotation, opacity, translateY],
  )

  const openDropdown = useCallback(() => {
    const node = triggerRef.current as View & {
      measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void
    }

    if (!node?.measureInWindow) {
      setTriggerLayout({ x: 8, y: 8, width: 160, height: 32 })
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

  const closeDropdown = useCallback(() => {
    animateClose(() => setVisible(false))
  }, [animateClose])

  const handleItemPress = useCallback(
    async (item: DropdownMenuConfig['items'][number]) => {
      closeDropdown()
      await dispatch(item.onPress)
    },
    [closeDropdown, dispatch],
  )

  const chevronRotationInterpolated = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  const panelPositionStyle = useMemo(() => {
    if (!triggerLayout) return {}
    const align = config.align ?? 'start'
    const panelLeft =
      align === 'start' ? triggerLayout.x : triggerLayout.x + triggerLayout.width - 160
    const panelTop = triggerLayout.y + triggerLayout.height + 4

    return {
      top: panelTop,
      left: Math.max(8, Math.min(panelLeft, SCREEN_WIDTH - 168)),
    }
  }, [config.align, triggerLayout])

  const triggerTestID = config.testID ? `${config.testID}-trigger` : `${config.id ?? 'dropdown'}-trigger`

  const renderItem = useCallback(
    ({ item, index }: { item: DropdownMenuConfig['items'][number]; index: number }) => {
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
            testID={`dropdown-item-${item.id}`}
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

  const keyExtractor = useCallback((item: DropdownMenuConfig['items'][number]) => item.id, [])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={visible ? ['open'] : undefined}
    >
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          onPress={openDropdown}
          style={triggerSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityState={{ expanded: visible }}
          accessibilityLabel={`${config.trigger.label} menu`}
          testID={triggerTestID}
          activeOpacity={0.75}
        >
          {config.trigger.icon != null ? (
            <Text
              style={{
                ...baseTextStyle,
                ...(triggerIconSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
            >
              {config.trigger.icon}
            </Text>
          ) : null}
          <Text
            style={{
              ...baseTextStyle,
              flex: 1,
              ...(triggerLabelSurface.style as TextStyle | undefined),
            }}
          >
            {config.trigger.label}
          </Text>
          <Animated.Text
            style={[
              {
                ...baseTextStyle,
                transform: [{ rotate: chevronRotationInterpolated }],
              },
              chevronSurface.style as TextStyle | undefined,
            ]}
            accessibilityElementsHidden
          >
            Open
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {visible ? (
        <Modal
          visible={visible}
          transparent
          animationType="none"
          onRequestClose={closeDropdown}
          statusBarTranslucent
        >
          <TouchableWithoutFeedback onPress={closeDropdown} accessibilityLabel="Close menu">
            <View style={backdropSurface.style as ViewStyle | undefined} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              {
                position: 'absolute',
                opacity,
                transform: [{ translateY }],
              },
              panelSurface.style as ViewStyle | undefined,
              panelPositionStyle,
            ]}
            accessibilityRole="menu"
            accessibilityLabel={`${config.trigger.label} menu`}
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
