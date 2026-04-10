import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { Action } from '../../../actions/types'
import type { DrawerMenuConfig } from './types'

const ANIMATION_DURATION = 280

// ── Types ──────────────────────────────────────────────────────────────────────

interface DrawerMenuItem {
  id: string
  label: string
  icon?: string
  badge?: number
  section?: string
  onPress?: Action
}

interface SectionGroup {
  section: string | undefined
  items: DrawerMenuItem[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupBySection(items: DrawerMenuItem[]): SectionGroup[] {
  const groups: SectionGroup[] = []
  const seen = new Map<string | undefined, SectionGroup>()

  for (const item of items) {
    const key = item.section
    const existing = seen.get(key)
    if (existing) {
      existing.items.push(item)
    } else {
      const group: SectionGroup = { section: key, items: [item] }
      groups.push(group)
      seen.set(key, group)
    }
  }

  return groups
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeStyles(
  tokens: DesignTokens,
  position: 'left' | 'right',
  widthPercent: number,
) {
  const screenWidth = Dimensions.get('window').width
  const drawerWidth = (screenWidth * widthPercent) / 100

  return StyleSheet.create({
    fill: {
      ...StyleSheet.absoluteFillObject,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tokens.colors.overlay,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      [position]: 0,
      width: drawerWidth,
      backgroundColor: tokens.colors.surface,
      ...tokens.shadows.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[8],
      paddingBottom: tokens.spacing[4],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
      gap: tokens.spacing[3],
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: tokens.colors.muted,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: tokens.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlaceholderText: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.primaryForeground,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    headerSubtitle: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginTop: 2,
    },
    sectionHeader: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[1],
    },
    sectionTitle: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[3],
    },
    menuItemActive: {
      backgroundColor: tokens.colors.muted,
    },
    menuItemIcon: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.textMuted,
      width: 24,
      textAlign: 'center',
    },
    menuItemIconActive: {
      color: tokens.colors.primary,
    },
    menuItemLabel: {
      flex: 1,
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    menuItemLabelActive: {
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    badgeContainer: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: tokens.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.errorForeground,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.divider,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
    },
    footerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[2],
    },
    footerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.textMuted,
    },
    content: {
      flex: 1,
    },
  })
}

// ── Public component ───────────────────────────────────────────────────────────

/**
 * Config-driven side drawer navigation menu. Opens via ScreenContext key
 * `__drawerMenu_{id}`. Slides in from the configured side with an animated
 * translateX transition and a fade-in backdrop.
 *
 * Features:
 * - Header with avatar, title, subtitle
 * - Items grouped by section with section headers
 * - Active item highlight (publishes active item id to ScreenContext)
 * - Badge counts on items
 * - Footer action (e.g., logout)
 * - Backdrop tap and Android back button close
 */
export function DrawerMenu({ config }: { config: DrawerMenuConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()

  const position = config.position ?? 'left'
  const widthPercent = config.widthPercent ?? 80

  const screenWidth = Dimensions.get('window').width
  const drawerWidth = (screenWidth * widthPercent) / 100
  const hiddenX = position === 'left' ? -drawerWidth : drawerWidth

  const contextKey = `__drawerMenu_${config.id}`
  const isOpen = Boolean(getValue(contextKey))

  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (isOpen) setIsVisible(true)
  }, [isOpen])

  const translateX = useRef(new Animated.Value(hiddenX)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

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
      if (!isOpen) setIsVisible(false)
    })
  }, [isOpen, translateX, backdropOpacity, hiddenX])

  const handleClose = useCallback(() => {
    setValue(contextKey, false)
  }, [setValue, contextKey])

  const handleItemPress = useCallback(
    (item: DrawerMenuItem) => {
      setValue(`${config.id}_activeItem`, item.id)
      if (item.onPress) {
        void dispatch(item.onPress)
      }
      handleClose()
    },
    [config.id, dispatch, handleClose, setValue],
  )

  const styles = useMemo(
    () => makeStyles(tokens, position, widthPercent),
    [tokens, position, widthPercent],
  )

  const idPrefix = config.testID ?? `drawer-menu-${config.id}`
  const activeItemId = getValue(`${config.id}_activeItem`) as string | undefined

  const sectionGroups = useMemo(() => groupBySection(config.items), [config.items])

  // Build flat list data with section headers
  const flatData = useMemo(() => {
    const result: Array<
      | { type: 'section'; section: string; key: string }
      | { type: 'item'; item: DrawerMenuItem; key: string }
    > = []

    for (const group of sectionGroups) {
      if (group.section != null) {
        result.push({ type: 'section', section: group.section, key: `section-${group.section}` })
      }
      for (const item of group.items) {
        result.push({ type: 'item', item, key: `item-${item.id}` })
      }
    }

    return result
  }, [sectionGroups])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <Modal
        transparent
        animationType="none"
        visible={isVisible}
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <View style={styles.fill}>
          {/* Backdrop */}
          <TouchableWithoutFeedback
            onPress={handleClose}
            accessibilityRole="none"
            accessibilityLabel="Close drawer menu"
          >
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>

          {/* Drawer panel */}
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX }] }]}
            testID={`${idPrefix}-panel`}
          >
            {/* Header */}
            {config.header != null && (
              <View style={styles.header} testID={`${idPrefix}-header`}>
                {config.header.avatar != null ? (
                  <Image
                    source={{ uri: config.header.avatar }}
                    style={styles.avatar}
                    accessibilityLabel={`${config.header.title} avatar`}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {config.header.title.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {config.header.title}
                  </Text>
                  {config.header.subtitle != null && (
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                      {config.header.subtitle}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Items */}
            <FlatList
              style={styles.content}
              data={flatData}
              keyExtractor={(row) => row.key}
              renderItem={({ item: row }) => {
                if (row.type === 'section') {
                  return (
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>{row.section}</Text>
                    </View>
                  )
                }

                const item = row.item
                const isActive = item.id === activeItemId

                return (
                  <TouchableOpacity
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    onPress={() => handleItemPress(item)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={item.label}
                    accessibilityHint={item.badge ? `${item.badge} notifications` : undefined}
                    testID={`${idPrefix}-item-${item.id}`}
                  >
                    {item.icon != null && (
                      <Text
                        style={[
                          styles.menuItemIcon,
                          isActive && styles.menuItemIconActive,
                        ]}
                        accessibilityElementsHidden
                      >
                        {item.icon}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.menuItemLabel,
                        isActive && styles.menuItemLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.badge != null && item.badge > 0 && (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              }}
            />

            {/* Footer */}
            {config.footer != null && (
              <View style={styles.footer} testID={`${idPrefix}-footer`}>
                <TouchableOpacity
                  style={styles.footerButton}
                  onPress={() => void dispatch(config.footer!.onPress)}
                  accessibilityRole="button"
                  accessibilityLabel={config.footer.label}
                  testID={`${idPrefix}-footer-action`}
                >
                  <Text style={styles.footerLabel}>{config.footer.label}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ComponentWrapper>
  )
}
