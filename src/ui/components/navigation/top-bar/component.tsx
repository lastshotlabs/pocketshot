import React from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { Action } from '../../../actions/types'
import type { TopBarConfig } from './types'

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

const PRESET_ICONS: Record<string, { icon: string; label: string }> = {
  back: { icon: '<', label: 'Go back' },
  menu: { icon: '=', label: 'Open menu' },
  close: { icon: 'X', label: 'Close' },
}

interface ActionButtonProps {
  icon: string
  label: string
  onPress: () => void
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
        <Text
          style={{
            ...baseTextStyle,
            ...(iconTextStyle ?? {}),
          }}
        >
          {icon}
        </Text>
      </TouchableOpacity>
      {badge != null && badge > 0 ? (
        <View style={badgeStyle} accessibilityLabel={`${badge} notifications`}>
          <Text
            style={{
              ...baseTextStyle,
              ...(badgeTextStyle ?? {}),
            }}
          >
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export function TopBar({ config }: { config: TopBarConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const topInset = useTopInset()
  const transparent = config.transparent ?? false
  const elevated = config.elevated ?? true
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

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingX: 'md',
      paddingY: 'sm',
      minHeight: 48,
    },
    componentSurface: config.slots?.row as Record<string, unknown> | undefined,
  })
  const leftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 48,
    },
    componentSurface: config.slots?.left as Record<string, unknown> | undefined,
  })
  const centerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      alignItems: 'center',
    },
    componentSurface: config.slots?.center as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.right as Record<string, unknown> | undefined,
  })
  const iconButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'xs',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: config.slots?.iconButton as Record<string, unknown> | undefined,
  })
  const iconTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: transparent ? 'background' : 'primary',
    },
    componentSurface: config.slots?.iconText as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: transparent ? 'background' : 'foreground',
      textAlign: 'center',
    },
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const subtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: transparent ? 'background' : 'muted',
      textAlign: 'center',
      marginTop: 2,
    },
    componentSurface: config.slots?.subtitle as Record<string, unknown> | undefined,
  })
  const badgeContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'relative',
    },
    componentSurface: config.slots?.badgeContainer as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.badge as Record<string, unknown> | undefined,
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

  const resolvedTitle = resolveFromRef(config.title, values) as string | undefined
  const idPrefix = config.testID ?? config.id ?? 'top-bar'

  function renderLeftAction() {
    if (config.leftAction == null) return null

    if (typeof config.leftAction === 'string') {
      const preset = PRESET_ICONS[config.leftAction]
      if (!preset) return null

      const handlePress = () => {
        if (config.leftAction === 'back' || config.leftAction === 'close') {
          void dispatch({ type: 'navigate', to: '..' })
          return
        }

        void dispatch({ type: 'set-value', target: '__drawerMenu', value: true })
      }

      return (
        <ActionButton
          icon={preset.icon}
          label={preset.label}
          onPress={handlePress}
          testID={`${idPrefix}-left-${config.leftAction}`}
          baseTextStyle={baseTextStyle}
          iconButtonStyle={iconButtonSurface.style as ViewStyle | undefined}
          iconTextStyle={iconTextSurface.style as TextStyle | undefined}
          badgeContainerStyle={badgeContainerSurface.style as ViewStyle | undefined}
          badgeStyle={badgeSurface.style as ViewStyle | undefined}
          badgeTextStyle={badgeTextSurface.style as TextStyle | undefined}
        />
      )
    }

    const customAction = config.leftAction as { icon: string; onPress: Action }
    return (
      <ActionButton
        icon={customAction.icon}
        label="Action"
        onPress={() => void dispatch(customAction.onPress)}
        testID={`${idPrefix}-left-custom`}
        baseTextStyle={baseTextStyle}
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
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={wrapperStyle}>
      <View style={rowSurface.style as ViewStyle | undefined} accessibilityRole="header">
        <View style={leftSurface.style as ViewStyle | undefined}>{renderLeftAction()}</View>

        <View style={centerSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...baseTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {resolvedTitle ?? ''}
          </Text>
          {config.subtitle != null ? (
            <Text
              style={{
                ...baseTextStyle,
                ...(subtitleSurface.style as TextStyle | undefined),
              }}
              numberOfLines={1}
            >
              {config.subtitle}
            </Text>
          ) : null}
        </View>

        <View style={rightSurface.style as ViewStyle | undefined}>
          {(config.rightActions ?? []).map((ra, index) => (
            <ActionButton
              key={index}
              icon={ra.icon}
              label={`Action ${index + 1}`}
              onPress={() => void dispatch(ra.onPress)}
              badge={ra.badge}
              testID={`${idPrefix}-right-action-${index}`}
              baseTextStyle={baseTextStyle}
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
    </ComponentWrapper>
  )
}
