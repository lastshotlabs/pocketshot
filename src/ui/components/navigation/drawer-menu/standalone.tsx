import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

const ANIMATION_DURATION = 280

export interface DrawerMenuItem {
  id: string
  label: string
  icon?: string
  badge?: number
  section?: string
  onPress?: () => void
}

export interface DrawerMenuHeader {
  title: string
  subtitle?: string
  avatar?: string
}

export interface DrawerMenuFooter {
  label: string
  onPress?: () => void
}

export type DrawerMenuPosition = 'left' | 'right'

export interface DrawerMenuBaseProps {
  visible: boolean
  onClose: () => void
  items: DrawerMenuItem[]
  header?: DrawerMenuHeader
  footer?: DrawerMenuFooter
  /** Currently active item id. */
  activeItemId?: string
  /** Side. */
  position?: DrawerMenuPosition
  /** Width as percent of screen (1-100). */
  widthPercent?: number
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

interface SectionGroup {
  section: string | undefined
  items: DrawerMenuItem[]
}

function groupBySection(items: DrawerMenuItem[]): SectionGroup[] {
  const groups: SectionGroup[] = []
  const seen = new Map<string | undefined, SectionGroup>()
  for (const item of items) {
    const existing = seen.get(item.section)
    if (existing) {
      existing.items.push(item)
      continue
    }
    const group: SectionGroup = { section: item.section, items: [item] }
    groups.push(group)
    seen.set(item.section, group)
  }
  return groups
}

/**
 * Standalone DrawerMenu — plain React props, no manifest required.
 *
 * @example
 * <DrawerMenuBase
 *   visible={open}
 *   onClose={() => setOpen(false)}
 *   items={[{ id: 'home', label: 'Home', icon: 'H', onPress: () => {} }]}
 * />
 */
export function DrawerMenuBase({
  visible,
  onClose,
  items,
  header,
  footer,
  activeItemId,
  position = 'left',
  widthPercent = 80,
  style,
  slots,
  testID,
  id,
}: DrawerMenuBaseProps) {
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
    implementationBase: { bg: 'card', shadow: 'xl' },
    componentSurface: slots?.panel,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingTop: '2xl',
      paddingBottom: 'md',
      gap: 'sm',
    },
    componentSurface: slots?.header,
  })
  const avatarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: 48, height: 48, borderRadius: 'full', bg: 'muted' },
    componentSurface: slots?.avatar,
  })
  const avatarPlaceholderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: 48,
      height: 48,
      borderRadius: 'full',
      bg: 'primary',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: slots?.avatarPlaceholder,
  })
  const avatarPlaceholderTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'lg', fontWeight: 'bold', color: 'primaryForeground' },
    componentSurface: slots?.avatarPlaceholderText,
  })
  const headerTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.headerText,
  })
  const headerTitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', fontWeight: 'semibold', color: 'foreground' },
    componentSurface: slots?.headerTitle,
  })
  const headerSubtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', marginTop: 2 },
    componentSurface: slots?.headerSubtitle,
  })
  const sectionHeaderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingTop: 'md', paddingBottom: 'xs' },
    componentSurface: slots?.sectionHeader,
  })
  const sectionTitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'semibold',
      color: 'muted',
      letterSpacing: 'wide',
    },
    componentSurface: slots?.sectionTitle,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.content,
  })
  const menuItemSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'sm',
      gap: 'sm',
      states: { selected: { bg: 'muted' } },
    },
    componentSurface: slots?.menuItem,
  })
  const menuItemIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: 'muted',
      width: 24,
      textAlign: 'center',
      states: { selected: { color: 'primary' } },
    },
    componentSurface: slots?.menuItemIcon,
  })
  const menuItemLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      states: { selected: { color: 'primary', fontWeight: 'semibold' } },
    },
    componentSurface: slots?.menuItemLabel,
  })
  const badgeContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      minWidth: 20,
      height: 20,
      borderRadius: 'full',
      bg: 'error',
      alignItems: 'center',
      justifyContent: 'center',
      paddingX: 'xs',
    },
    componentSurface: slots?.badgeContainer,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', fontWeight: 'bold', color: 'errorForeground' },
    componentSurface: slots?.badgeText,
  })
  const footerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingY: 'md' },
    componentSurface: slots?.footer,
  })
  const footerButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'center', paddingY: 'xs' },
    componentSurface: slots?.footerButton,
  })
  const footerLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'medium', color: 'muted' },
    componentSurface: slots?.footerLabel,
  })

  const idPrefix = testID ?? `drawer-menu-${id ?? ''}`

  const sectionGroups = useMemo(() => groupBySection(items), [items])
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
          onPress={onClose}
          accessibilityRole="none"
          accessibilityLabel="Close drawer menu"
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
          testID={`${idPrefix}-panel`}
        >
          {header != null ? (
            <View
              style={headerSurface.style as ViewStyle | undefined}
              testID={`${idPrefix}-header`}
            >
              {header.avatar != null ? (
                <Image
                  source={{ uri: header.avatar }}
                  style={avatarSurface.style as ImageStyle | undefined}
                  accessibilityLabel={`${header.title} avatar`}
                  resizeMode="cover"
                />
              ) : (
                <View style={avatarPlaceholderSurface.style as ViewStyle | undefined}>
                  <Text
                    style={{
                      ...sharedTextStyle,
                      ...(avatarPlaceholderTextSurface.style as TextStyle | undefined),
                    }}
                  >
                    {header.title.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={headerTextSurface.style as ViewStyle | undefined}>
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(headerTitleSurface.style as TextStyle | undefined),
                  }}
                  numberOfLines={1}
                >
                  {header.title}
                </Text>
                {header.subtitle != null ? (
                  <Text
                    style={{
                      ...sharedTextStyle,
                      ...(headerSubtitleSurface.style as TextStyle | undefined),
                    }}
                    numberOfLines={1}
                  >
                    {header.subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
          <FlatList
            style={contentSurface.style as ViewStyle | undefined}
            data={flatData}
            keyExtractor={(row) => row.key}
            renderItem={({ item: row }) => {
              if (row.type === 'section') {
                return (
                  <View style={sectionHeaderSurface.style as ViewStyle | undefined}>
                    <Text
                      style={{
                        ...sharedTextStyle,
                        ...(sectionTitleSurface.style as TextStyle | undefined),
                      }}
                    >
                      {row.section}
                    </Text>
                  </View>
                )
              }
              const item = row.item
              const isActive = item.id === activeItemId
              const activeStates: RuntimeSurfaceState[] | undefined = isActive
                ? ['selected']
                : undefined
              const resolvedItemStyle = resolveSurfacePresentation({
                tokens,
                implementationBase: menuItemSurface.resolvedConfigForWrapper,
                activeStates,
              }).style as ViewStyle | undefined
              const resolvedIconStyle = resolveSurfacePresentation({
                tokens,
                implementationBase: menuItemIconSurface.resolvedConfigForWrapper,
                activeStates,
              }).style as TextStyle | undefined
              const resolvedLabelStyle = resolveSurfacePresentation({
                tokens,
                implementationBase: menuItemLabelSurface.resolvedConfigForWrapper,
                activeStates,
              }).style as TextStyle | undefined

              return (
                <TouchableOpacity
                  style={resolvedItemStyle}
                  onPress={() => {
                    item.onPress?.()
                    onClose()
                  }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={item.label}
                  accessibilityHint={item.badge ? `${item.badge} notifications` : undefined}
                  testID={`${idPrefix}-item-${item.id}`}
                >
                  {item.icon != null ? (
                    <Text
                      style={{ ...sharedTextStyle, ...(resolvedIconStyle ?? {}) }}
                      accessibilityElementsHidden
                    >
                      {item.icon}
                    </Text>
                  ) : null}
                  <Text
                    style={{ ...sharedTextStyle, ...(resolvedLabelStyle ?? {}) }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {item.badge != null && item.badge > 0 ? (
                    <View style={badgeContainerSurface.style as ViewStyle | undefined}>
                      <Text
                        style={{
                          ...sharedTextStyle,
                          ...(badgeTextSurface.style as TextStyle | undefined),
                        }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              )
            }}
          />
          {footer != null ? (
            <View
              style={footerSurface.style as ViewStyle | undefined}
              testID={`${idPrefix}-footer`}
            >
              <TouchableOpacity
                style={footerButtonSurface.style as ViewStyle | undefined}
                onPress={footer.onPress}
                accessibilityRole="button"
                accessibilityLabel={footer.label}
                testID={`${idPrefix}-footer-action`}
              >
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(footerLabelSurface.style as TextStyle | undefined),
                  }}
                >
                  {footer.label}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  )
}
