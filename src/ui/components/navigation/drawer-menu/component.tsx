import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { Action } from '../../../actions/types'
import type { DrawerMenuConfig } from './types'

const ANIMATION_DURATION = 280

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

export function DrawerMenu({ config }: { config: DrawerMenuConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()
  const position = config.position ?? 'left'
  const widthPercent = config.widthPercent ?? 80
  const contextKey = `__drawerMenu_${config.id}`
  const isOpen = Boolean(getValue(contextKey))
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const screenWidth = Dimensions.get('window').width
  const drawerWidth = (screenWidth * widthPercent) / 100
  const hiddenX = position === 'left' ? -drawerWidth : drawerWidth

  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
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
      if (!isOpen) {
        setIsVisible(false)
      }
    })
  }, [backdropOpacity, hiddenX, isOpen, translateX])

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
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'card', shadow: 'xl' },
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const avatarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: 48,
      height: 48,
      borderRadius: 'full',
      bg: 'muted',
    },
    componentSurface: config.slots?.avatar as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.avatarPlaceholder as Record<string, unknown> | undefined,
  })
  const avatarPlaceholderTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'bold',
      color: 'primaryForeground',
    },
    componentSurface: config.slots?.avatarPlaceholderText as Record<string, unknown> | undefined,
  })
  const headerTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
    },
    componentSurface: config.slots?.headerText as Record<string, unknown> | undefined,
  })
  const headerTitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: 'foreground',
    },
    componentSurface: config.slots?.headerTitle as Record<string, unknown> | undefined,
  })
  const headerSubtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      marginTop: 2,
    },
    componentSurface: config.slots?.headerSubtitle as Record<string, unknown> | undefined,
  })
  const sectionHeaderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingTop: 'md',
      paddingBottom: 'xs',
    },
    componentSurface: config.slots?.sectionHeader as Record<string, unknown> | undefined,
  })
  const sectionTitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'semibold',
      color: 'muted',
      letterSpacing: 'wide',
    },
    componentSurface: config.slots?.sectionTitle as Record<string, unknown> | undefined,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
    },
    componentSurface: config.slots?.content as Record<string, unknown> | undefined,
  })
  const menuItemSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'sm',
      gap: 'sm',
      states: {
        selected: {
          bg: 'muted',
        },
      },
    },
    componentSurface: config.slots?.menuItem as Record<string, unknown> | undefined,
  })
  const menuItemIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: 'muted',
      width: 24,
      textAlign: 'center',
      states: {
        selected: {
          color: 'primary',
        },
      },
    },
    componentSurface: config.slots?.menuItemIcon as Record<string, unknown> | undefined,
  })
  const menuItemLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      states: {
        selected: {
          color: 'primary',
          fontWeight: 'semibold',
        },
      },
    },
    componentSurface: config.slots?.menuItemLabel as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.badgeContainer as Record<string, unknown> | undefined,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      fontWeight: 'bold',
      color: 'errorForeground',
    },
    componentSurface: config.slots?.badgeText as Record<string, unknown> | undefined,
  })
  const footerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.footer as Record<string, unknown> | undefined,
  })
  const footerButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingY: 'xs',
    },
    componentSurface: config.slots?.footerButton as Record<string, unknown> | undefined,
  })
  const footerLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'muted',
    },
    componentSurface: config.slots?.footerLabel as Record<string, unknown> | undefined,
  })

  const handleClose = useCallback(() => {
    setValue(contextKey, false)
  }, [contextKey, setValue])

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

  const idPrefix = config.testID ?? `drawer-menu-${config.id}`
  const activeItemId = getValue(`${config.id}_activeItem`) as string | undefined

  const sectionGroups = useMemo(() => groupBySection(config.items), [config.items])
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
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={isOpen ? ['open'] : undefined}>
      <Modal
        transparent
        animationType="none"
        visible={isVisible}
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <View style={fillStyle}>
          <TouchableWithoutFeedback
            onPress={handleClose}
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
            ]}
            testID={`${idPrefix}-panel`}
          >
            {config.header != null ? (
              <View style={headerSurface.style as ViewStyle | undefined} testID={`${idPrefix}-header`}>
                {config.header.avatar != null ? (
                  <Image
                    source={{ uri: config.header.avatar }}
                    style={avatarSurface.style as ImageStyle | undefined}
                    accessibilityLabel={`${config.header.title} avatar`}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={avatarPlaceholderSurface.style as ViewStyle | undefined}>
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(avatarPlaceholderTextSurface.style as TextStyle | undefined),
                      }}
                    >
                      {config.header.title.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={headerTextSurface.style as ViewStyle | undefined}>
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(headerTitleSurface.style as TextStyle | undefined),
                    }}
                    numberOfLines={1}
                  >
                    {config.header.title}
                  </Text>
                  {config.header.subtitle != null ? (
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(headerSubtitleSurface.style as TextStyle | undefined),
                      }}
                      numberOfLines={1}
                    >
                      {config.header.subtitle}
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
                          ...baseTextStyle,
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
                const activeStates: RuntimeSurfaceState[] | undefined = isActive ? ['selected'] : undefined
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
                    onPress={() => handleItemPress(item)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={item.label}
                    accessibilityHint={item.badge ? `${item.badge} notifications` : undefined}
                    testID={`${idPrefix}-item-${item.id}`}
                  >
                    {item.icon != null ? (
                      <Text
                        style={{
                          ...baseTextStyle,
                          ...(resolvedIconStyle ?? {}),
                        }}
                        accessibilityElementsHidden
                      >
                        {item.icon}
                      </Text>
                    ) : null}
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(resolvedLabelStyle ?? {}),
                      }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.badge != null && item.badge > 0 ? (
                      <View style={badgeContainerSurface.style as ViewStyle | undefined}>
                        <Text
                          style={{
                            ...baseTextStyle,
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

            {config.footer != null ? (
              <View style={footerSurface.style as ViewStyle | undefined} testID={`${idPrefix}-footer`}>
                <TouchableOpacity
                  style={footerButtonSurface.style as ViewStyle | undefined}
                  onPress={() => void dispatch(config.footer!.onPress)}
                  accessibilityRole="button"
                  accessibilityLabel={config.footer.label}
                  testID={`${idPrefix}-footer-action`}
                >
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(footerLabelSurface.style as TextStyle | undefined),
                    }}
                  >
                    {config.footer.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
    </ComponentWrapper>
  )
}
