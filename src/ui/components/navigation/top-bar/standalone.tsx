import React from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

function useTopInset(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSafeAreaInsets } =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSafeAreaInsets().top
  } catch {
    return 44
  }
}

export interface TopBarActionItem {
  icon: string
  label?: string
  badge?: number
  onPress?: () => void
}

export type TopBarLeftAction =
  | { kind: 'back' | 'menu' | 'close'; onPress?: () => void }
  | { kind: 'custom'; icon: string; label?: string; onPress?: () => void }

const PRESET_ICONS: Record<string, { icon: string; label: string }> = {
  back: { icon: '<', label: 'Go back' },
  menu: { icon: '=', label: 'Open menu' },
  close: { icon: 'X', label: 'Close' },
}

export interface TopBarBaseProps {
  title: string
  subtitle?: string
  /** Transparent variant. */
  transparent?: boolean
  /** Apply elevation shadow. */
  elevated?: boolean
  /** Left action (preset icon or custom). */
  leftAction?: TopBarLeftAction
  /** Right action buttons. */
  rightActions?: TopBarActionItem[]
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone TopBar — plain React props, no manifest required.
 *
 * @example
 * <TopBarBase title="Inbox" leftAction={{ kind: 'menu', onPress: () => openMenu() }} />
 */
export function TopBarBase({
  title,
  subtitle,
  transparent = false,
  elevated = true,
  leftAction,
  rightActions = [],
  style,
  slots,
  testID,
  id,
}: TopBarBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const topInset = useTopInset()

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'sm',
      minHeight: 48,
    },
    componentSurface: slots?.row,
  })
  const leftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'center', minWidth: 48 },
    componentSurface: slots?.left,
  })
  const centerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, alignItems: 'center' },
    componentSurface: slots?.center,
  })
  const rightSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'end',
      minWidth: 48,
      gap: 'xs',
    },
    componentSurface: slots?.right,
  })
  const iconButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { padding: 'xs', alignItems: 'center', justifyContent: 'center' },
    componentSurface: slots?.iconButton,
  })
  const iconTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'lg', color: transparent ? 'background' : 'primary' },
    componentSurface: slots?.iconText,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: transparent ? 'background' : 'foreground',
      textAlign: 'center',
    },
    componentSurface: slots?.title,
  })
  const subtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: transparent ? 'background' : 'muted',
      textAlign: 'center',
      marginTop: 2,
    },
    componentSurface: slots?.subtitle,
  })
  const badgeContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { position: 'relative' },
    componentSurface: slots?.badgeContainer,
  })
  const badgeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      minWidth: 16,
      height: 16,
      borderRadius: 'full',
      bg: 'error',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: slots?.badge,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', fontWeight: 'bold', color: 'errorForeground' },
    componentSurface: slots?.badgeText,
  })

  const idPrefix = testID ?? id ?? 'top-bar'

  function renderLeftAction() {
    if (!leftAction) return null
    if (leftAction.kind === 'custom') {
      return (
        <ActionButton
          icon={leftAction.icon}
          label={leftAction.label ?? 'Action'}
          onPress={leftAction.onPress}
          testID={`${idPrefix}-left-custom`}
          baseTextStyle={sharedTextStyle}
          iconButtonStyle={iconButtonSurface.style as ViewStyle | undefined}
          iconTextStyle={iconTextSurface.style as TextStyle | undefined}
          badgeContainerStyle={badgeContainerSurface.style as ViewStyle | undefined}
          badgeStyle={badgeSurface.style as ViewStyle | undefined}
          badgeTextStyle={badgeTextSurface.style as TextStyle | undefined}
        />
      )
    }
    const preset = PRESET_ICONS[leftAction.kind]
    if (!preset) return null
    return (
      <ActionButton
        icon={preset.icon}
        label={preset.label}
        onPress={leftAction.onPress}
        testID={`${idPrefix}-left-${leftAction.kind}`}
        baseTextStyle={sharedTextStyle}
        iconButtonStyle={iconButtonSurface.style as ViewStyle | undefined}
        iconTextStyle={iconTextSurface.style as TextStyle | undefined}
        badgeContainerStyle={badgeContainerSurface.style as ViewStyle | undefined}
        badgeStyle={badgeSurface.style as ViewStyle | undefined}
        badgeTextStyle={badgeTextSurface.style as TextStyle | undefined}
      />
    )
  }

  const wrapperStyle: ViewStyle = {
    paddingTop: topInset,
    backgroundColor: transparent ? 'transparent' : tokens.colors.surface,
    borderBottomWidth: transparent ? 0 : 1,
    borderBottomColor: tokens.colors.border,
    ...(transparent
      ? {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: tokens.zIndex.sticky,
        }
      : {}),
    ...(elevated && !transparent ? tokens.shadows.md : {}),
  }

  return (
    <View style={[wrapperStyle, style]} testID={testID ?? id}>
      <View style={rowSurface.style as ViewStyle | undefined} accessibilityRole="header">
        <View style={leftSurface.style as ViewStyle | undefined}>{renderLeftAction()}</View>
        <View style={centerSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...sharedTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(subtitleSurface.style as TextStyle | undefined),
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={rightSurface.style as ViewStyle | undefined}>
          {rightActions.map((ra, index) => (
            <ActionButton
              key={index}
              icon={ra.icon}
              label={ra.label ?? `Action ${index + 1}`}
              onPress={ra.onPress}
              badge={ra.badge}
              testID={`${idPrefix}-right-action-${index}`}
              baseTextStyle={sharedTextStyle}
              iconButtonStyle={iconButtonSurface.style as ViewStyle | undefined}
              iconTextStyle={iconTextSurface.style as TextStyle | undefined}
              badgeContainerStyle={badgeContainerSurface.style as ViewStyle | undefined}
              badgeStyle={{
                right: 0,
                top: 0,
                ...(badgeSurface.style as ViewStyle | undefined),
              }}
              badgeTextStyle={badgeTextSurface.style as TextStyle | undefined}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

interface ActionButtonProps {
  icon: string
  label: string
  onPress?: () => void
  badge?: number
  testID: string
  baseTextStyle: TextStyle
  iconButtonStyle?: ViewStyle
  iconTextStyle?: TextStyle
  badgeContainerStyle?: ViewStyle
  badgeStyle?: ViewStyle
  badgeTextStyle?: TextStyle
}

function ActionButton({
  icon,
  label,
  onPress,
  badge,
  testID,
  baseTextStyle,
  iconButtonStyle,
  iconTextStyle,
  badgeContainerStyle,
  badgeStyle,
  badgeTextStyle,
}: ActionButtonProps) {
  return (
    <View style={badgeContainerStyle}>
      <TouchableOpacity
        onPress={onPress}
        style={iconButtonStyle}
        accessibilityLabel={label}
        accessibilityRole="button"
        testID={testID}
      >
        <Text style={{ ...baseTextStyle, ...(iconTextStyle ?? {}) }}>{icon}</Text>
      </TouchableOpacity>
      {badge != null && badge > 0 ? (
        <View style={badgeStyle} accessibilityLabel={`${badge} notifications`}>
          <Text style={{ ...baseTextStyle, ...(badgeTextStyle ?? {}) }}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
