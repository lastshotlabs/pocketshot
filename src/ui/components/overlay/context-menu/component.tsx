import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ContextMenuConfig } from './types'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Haptic helper — no-op safe per rule 32
// ---------------------------------------------------------------------------

function triggerHaptic() {
  try {
    const Haptics = require('expo-haptics')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch {
    // expo-haptics not available — no-op
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    panel: {
      position: 'absolute',
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.md,
      minWidth: 180,
      ...tokens.shadows.xl,
      overflow: 'hidden',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[2],
    },
    itemIcon: {
      fontSize: 16,
      width: 20,
      textAlign: 'center' as const,
    },
    itemLabel: {
      flex: 1,
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
    },
    itemLabelDestructive: {
      flex: 1,
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.destructive,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
      marginHorizontal: tokens.spacing[3],
    },
  })
}

// ---------------------------------------------------------------------------
// Item row
// ---------------------------------------------------------------------------

interface ContextMenuItemRowProps {
  item: ContextMenuConfig['items'][number]
  onPress: (item: ContextMenuConfig['items'][number]) => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  isLast: boolean
}

function ContextMenuItemRow({ item, onPress, tokens, styles, isLast }: ContextMenuItemRowProps) {
  const handlePress = useCallback(() => {
    if (!item.disabled) {
      onPress(item)
    }
  }, [item, onPress])

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.itemRow, item.disabled ? { opacity: 0.4 } : undefined]}
        disabled={item.disabled}
        accessibilityRole="menuitem"
        accessibilityLabel={item.label}
        accessibilityState={{ disabled: item.disabled }}
        testID={`context-menu-item-${item.id}`}
        activeOpacity={0.7}
      >
        {item.icon != null && (
          <Text
            style={[styles.itemIcon, item.destructive ? { color: tokens.colors.destructive } : undefined]}
            accessibilityElementsHidden
          >
            {item.icon}
          </Text>
        )}
        <Text style={item.destructive ? styles.itemLabelDestructive : styles.itemLabel}>
          {item.label}
        </Text>
      </TouchableOpacity>
      {!isLast && <View style={styles.separator} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------

export interface ContextMenuProps {
  config: ContextMenuConfig
  children?: ReactNode
}

/**
 * Long-press context menu. Wraps children in a Pressable; on long press,
 * shows a positioned menu near the trigger with fade + scale animation.
 * Fires haptic feedback on long press.
 */
export function ContextMenu({ config, children }: ContextMenuProps) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [visible, setVisible] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null)
  const triggerRef = useRef<View>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.9)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

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
    if (!triggerRef.current) return
    triggerRef.current.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height })
      setVisible(true)
    })
  }, [])

  useEffect(() => {
    if (visible) {
      animateOpen()
    }
  }, [visible, animateOpen])

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

  const panelStyle = useMemo(() => {
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
    ({ item, index }: { item: ContextMenuConfig['items'][number]; index: number }) => (
      <ContextMenuItemRow
        item={item}
        onPress={handleItemPress}
        tokens={tokens}
        styles={styles}
        isLast={index === config.items.length - 1}
      />
    ),
    [handleItemPress, tokens, styles, config.items.length],
  )

  const keyExtractor = useCallback((item: ContextMenuConfig['items'][number]) => item.id, [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
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

      {visible && (
        <Modal
          visible={visible}
          transparent
          animationType="none"
          onRequestClose={closeMenu}
          statusBarTranslucent
        >
          <TouchableWithoutFeedback onPress={closeMenu} accessibilityLabel="Close menu">
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.panel,
              panelStyle,
              { opacity, transform: [{ scale }] },
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
      )}
    </ComponentWrapper>
  )
}
