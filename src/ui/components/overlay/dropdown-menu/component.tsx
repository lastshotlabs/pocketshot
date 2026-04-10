import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
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
import type { DropdownMenuConfig } from './types'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    triggerIcon: {
      fontSize: tokens.typography.fontSizeMd,
    },
    triggerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      flex: 1,
    },
    chevron: {
      fontSize: 10,
      color: tokens.colors.textMuted,
      marginLeft: tokens.spacing[1],
    },
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
      minWidth: 160,
      ...tokens.shadows.xl,
      overflow: 'hidden',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[2],
    },
    itemIcon: {
      fontSize: 16,
      width: 20,
      textAlign: 'center',
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

interface DropdownItemRowProps {
  item: DropdownMenuConfig['items'][number]
  onPress: (item: DropdownMenuConfig['items'][number]) => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  isLast: boolean
}

function DropdownItemRow({ item, onPress, tokens, styles, isLast }: DropdownItemRowProps) {
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
        testID={`dropdown-item-${item.id}`}
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
// DropdownMenu
// ---------------------------------------------------------------------------

/**
 * A list of actions that drops below its trigger button. Uses measureInWindow
 * to position the panel near the trigger. Animates in with fade + translateY.
 */
export function DropdownMenu({ config }: { config: DropdownMenuConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [visible, setVisible] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null)
  const triggerRef = useRef<View>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-4)).current
  const chevronRotation = useRef(new Animated.Value(0)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(chevronRotation, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start()
  }, [opacity, translateY, chevronRotation])

  const animateClose = useCallback(
    (onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -4, duration: 120, useNativeDriver: true }),
        Animated.timing(chevronRotation, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(onDone)
    },
    [opacity, translateY, chevronRotation],
  )

  const openDropdown = useCallback(() => {
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

  // Position the panel below the trigger, aligned to start or end
  const panelStyle = useMemo(() => {
    if (!triggerLayout) return {}
    const align = config.align ?? 'start'
    const panelLeft =
      align === 'start'
        ? triggerLayout.x
        : triggerLayout.x + triggerLayout.width - 160 // approximate minWidth
    const panelTop = triggerLayout.y + triggerLayout.height + 4

    return {
      top: panelTop,
      left: Math.max(8, Math.min(panelLeft, SCREEN_WIDTH - 168)),
    }
  }, [triggerLayout, config.align])

  const triggerTestID = config.testID ? `${config.testID}-trigger` : `${config.id ?? 'dropdown'}-trigger`

  const renderItem = useCallback(
    ({ item, index }: { item: DropdownMenuConfig['items'][number]; index: number }) => (
      <DropdownItemRow
        item={item}
        onPress={handleItemPress}
        tokens={tokens}
        styles={styles}
        isLast={index === config.items.length - 1}
      />
    ),
    [handleItemPress, tokens, styles, config.items.length],
  )

  const keyExtractor = useCallback((item: DropdownMenuConfig['items'][number]) => item.id, [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {/* Trigger */}
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          onPress={openDropdown}
          style={styles.trigger}
          accessibilityRole="button"
          accessibilityState={{ expanded: visible }}
          accessibilityLabel={`${config.trigger.label} menu`}
          testID={triggerTestID}
          activeOpacity={0.75}
        >
          {config.trigger.icon != null && (
            <Text style={styles.triggerIcon} accessibilityElementsHidden>
              {config.trigger.icon}
            </Text>
          )}
          <Text style={styles.triggerLabel}>{config.trigger.label}</Text>
          <Animated.Text
            style={[styles.chevron, { transform: [{ rotate: chevronRotationInterpolated }] }]}
            accessibilityElementsHidden
          >
            ▼
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      {visible && (
        <Modal
          visible={visible}
          transparent
          animationType="none"
          onRequestClose={closeDropdown}
          statusBarTranslucent
        >
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={closeDropdown} accessibilityLabel="Close menu">
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          {/* Panel */}
          <Animated.View
            style={[
              styles.panel,
              panelStyle,
              { opacity, transform: [{ translateY }] },
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
      )}
    </ComponentWrapper>
  )
}
