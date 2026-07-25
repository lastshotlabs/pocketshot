import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
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
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface DropdownMenuItem {
  id: string
  label: string
  icon?: string
  destructive?: boolean
  disabled?: boolean
  onPress?: () => void
}

export interface DropdownMenuTrigger {
  label: string
  icon?: string
}

export type DropdownMenuAlign = 'start' | 'end'

export interface DropdownMenuBaseProps {
  trigger: DropdownMenuTrigger
  items: DropdownMenuItem[]
  align?: DropdownMenuAlign
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone DropdownMenu — plain React props, no manifest required.
 *
 * @example
 * <DropdownMenuBase
 *   trigger={{ label: 'Actions' }}
 *   items={[{ id: 'edit', label: 'Edit', onPress: () => edit() }]}
 * />
 */
export function DropdownMenuBase({
  trigger,
  items,
  align = 'start',
  style,
  slots,
  testID,
  id,
}: DropdownMenuBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [visible, setVisible] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null)
  const triggerRef = useRef<View>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-4)).current
  const chevronRotation = useRef(new Animated.Value(0)).current

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
  const chevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted' },
    componentSurface: slots?.chevron,
  })
  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
    componentSurface: slots?.backdrop,
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
    componentSurface: slots?.panel,
  })
  const itemSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'md',
      gap: 'sm',
      states: { disabled: { opacity: 0.4 } },
    },
    componentSurface: slots?.item,
  })
  const itemIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'foreground' },
    componentSurface: slots?.itemIcon,
  })
  const itemLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'foreground' },
    componentSurface: slots?.itemLabel,
  })
  const separatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border' },
    componentSurface: slots?.separator,
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
      measureInWindow?: (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => void
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
    if (visible) animateOpen()
  }, [animateOpen, visible])

  const closeDropdown = useCallback(() => {
    animateClose(() => setVisible(false))
  }, [animateClose])

  const handleItemPress = useCallback(
    (item: DropdownMenuItem) => {
      closeDropdown()
      item.onPress?.()
    },
    [closeDropdown],
  )

  const chevronRotationInterpolated = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  const panelPositionStyle = useMemo(() => {
    if (!triggerLayout) return {}
    const panelLeft =
      align === 'start' ? triggerLayout.x : triggerLayout.x + triggerLayout.width - 160
    const panelTop = triggerLayout.y + triggerLayout.height + 4
    return {
      top: panelTop,
      left: Math.max(8, Math.min(panelLeft, SCREEN_WIDTH - 168)),
    }
  }, [align, triggerLayout])

  const triggerTestID = testID ? `${testID}-trigger` : `${id ?? 'dropdown'}-trigger`

  const renderItem = useCallback(
    ({ item, index }: { item: DropdownMenuItem; index: number }) => {
      const activeStates: RuntimeSurfaceState[] | undefined = item.disabled
        ? ['disabled']
        : undefined
      const destructiveColor = item.destructive ? tokens.colors.destructive : undefined
      const rowStyle = resolveSurfacePresentation({
        tokens,
        implementationBase: itemSurface.resolvedConfigForWrapper,
        activeStates,
      }).style as ViewStyle | undefined

      return (
        <View key={item.id}>
          <TouchableOpacity
            onPress={() => !item.disabled && handleItemPress(item)}
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
                  ...sharedTextStyle,
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
                ...sharedTextStyle,
                flex: 1,
                color: destructiveColor ?? undefined,
                ...(itemLabelSurface.style as TextStyle | undefined),
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
          {index < items.length - 1 ? (
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
      sharedTextStyle,
      handleItemPress,
      items.length,
      itemIconSurface.style,
      itemLabelSurface.style,
      itemSurface.resolvedConfigForWrapper,
      separatorSurface.style,
      tokens,
    ],
  )

  const keyExtractor = useCallback((item: DropdownMenuItem) => item.id, [])

  return (
    <View style={style} testID={testID ?? id}>
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          onPress={openDropdown}
          style={triggerSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityState={{ expanded: visible }}
          accessibilityLabel={`${trigger.label} menu`}
          testID={triggerTestID}
          activeOpacity={0.75}
        >
          {trigger.icon != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(triggerIconSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
            >
              {trigger.icon}
            </Text>
          ) : null}
          <Text
            style={{
              ...sharedTextStyle,
              flex: 1,
              ...(triggerLabelSurface.style as TextStyle | undefined),
            }}
          >
            {trigger.label}
          </Text>
          <Animated.Text
            style={[
              {
                ...sharedTextStyle,
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
              { position: 'absolute', opacity, transform: [{ translateY }] },
              panelSurface.style as ViewStyle | undefined,
              panelPositionStyle,
            ]}
            accessibilityRole="menu"
            accessibilityLabel={`${trigger.label} menu`}
          >
            <FlatList
              data={items}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          </Animated.View>
        </Modal>
      ) : null}
    </View>
  )
}
