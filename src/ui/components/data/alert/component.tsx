import React, { useCallback, useMemo, useState } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { AlertConfig } from './types'

type Variant = NonNullable<AlertConfig['variant']>

const DEFAULT_ICONS: Record<Variant, string> = {
  success: 'âœ“',
  warning: 'âš ',
  error: 'âœ•',
  info: 'â„¹',
  default: 'â€¢',
}

function resolveVariantColors(
  variant: Variant,
  tokens: DesignTokens,
): { accentColor: string; backgroundColor: string; textColor: string; bodyColor: string } {
  switch (variant) {
    case 'success':
      return {
        accentColor: tokens.colors.success,
        backgroundColor: tokens.colors.success + '1A',
        textColor: tokens.colors.success,
        bodyColor: tokens.colors.textMuted,
      }
    case 'warning':
      return {
        accentColor: tokens.colors.warning,
        backgroundColor: tokens.colors.warning + '1A',
        textColor: tokens.colors.warning,
        bodyColor: tokens.colors.textMuted,
      }
    case 'error':
      return {
        accentColor: tokens.colors.error,
        backgroundColor: tokens.colors.error + '1A',
        textColor: tokens.colors.error,
        bodyColor: tokens.colors.textMuted,
      }
    case 'info':
      return {
        accentColor: tokens.colors.info,
        backgroundColor: tokens.colors.info + '1A',
        textColor: tokens.colors.info,
        bodyColor: tokens.colors.textMuted,
      }
    case 'default':
    default:
      return {
        accentColor: tokens.colors.border,
        backgroundColor: tokens.colors.surfaceAlt,
        textColor: tokens.colors.text,
        bodyColor: tokens.colors.textMuted,
      }
  }
}

export function Alert({ config }: { config: AlertConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [dismissed, setDismissed] = useState(false)

  const variant = config.variant ?? 'default'
  const variantColors = useMemo(() => resolveVariantColors(variant, tokens), [variant, tokens])
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const rootSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.content as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const descriptionSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.description as Record<string, unknown> | undefined,
  })
  const dismissSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.dismiss as Record<string, unknown> | undefined,
  })
  const actionSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.action as Record<string, unknown> | undefined,
  })

  const icon = config.icon ?? DEFAULT_ICONS[variant]

  const handleDismiss = useCallback(async () => {
    setDismissed(true)
    if (config.onDismiss) {
      await dispatch(config.onDismiss)
    }
  }, [config.onDismiss, dispatch])

  const handleActionPress = useCallback(async () => {
    if (!config.action) return
    await dispatch(config.action.onPress)
  }, [config.action, dispatch])

  if (dismissed) return null

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    borderRadius: tokens.radius.md,
    backgroundColor: variantColors.backgroundColor,
    overflow: 'hidden',
  }
  const accentStyle: ViewStyle = {
    width: 4,
    backgroundColor: variantColors.accentColor,
  }
  const contentStyle: ViewStyle = {
    flex: 1,
    padding: tokens.spacing[3],
    paddingLeft: tokens.spacing[3],
  }
  const headerRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
  }
  const iconStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : variantColors.accentColor,
    marginRight: tokens.spacing[2],
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number'
        ? sharedTextStyle.lineHeight
        : tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
  }
  const titleRowStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
  const titleStyle: TextStyle = {
    flex: 1,
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : variantColors.textColor,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number'
        ? sharedTextStyle.lineHeight
        : tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
  }
  const dismissButtonStyle: ViewStyle = {
    marginLeft: tokens.spacing[2],
    padding: tokens.spacing[1],
  }
  const dismissTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.textMuted,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number'
        ? sharedTextStyle.lineHeight
        : tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
  }
  const bodyStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : variantColors.bodyColor,
    marginTop: tokens.spacing[1],
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number'
        ? sharedTextStyle.lineHeight
        : tokens.typography.fontSizeSm * tokens.typography.lineHeightRelaxed,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
  }
  const actionButtonStyle: ViewStyle = {
    marginTop: tokens.spacing[2],
    alignSelf: 'flex-start',
  }
  const actionTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : variantColors.accentColor,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={[containerStyle, rootSurface.style as ViewStyle | undefined]}
        accessibilityRole="alert"
        accessibilityLabel={`${config.title}${config.body ? '. ' + config.body : ''}`}
      >
        <View style={accentStyle} />
        <View style={[contentStyle, contentSurface.style as ViewStyle | undefined]}>
          <View style={headerRowStyle}>
            <Text
              style={[iconStyle, iconSurface.style as TextStyle | undefined]}
              accessibilityElementsHidden
            >
              {icon}
            </Text>
            <View style={titleRowStyle}>
              <Text style={[titleStyle, titleSurface.style as TextStyle | undefined]}>
                {config.title}
              </Text>
              {config.dismissible ? (
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={[dismissButtonStyle, dismissSurface.style as ViewStyle | undefined]}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss alert"
                  testID={config.testID ? `${config.testID}-dismiss` : undefined}
                >
                  <Text style={dismissTextStyle}>Ã—</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {config.body ? (
            <Text style={[bodyStyle, descriptionSurface.style as TextStyle | undefined]}>
              {config.body}
            </Text>
          ) : null}
          {config.action ? (
            <TouchableOpacity
              onPress={handleActionPress}
              style={[actionButtonStyle, actionSurface.style as ViewStyle | undefined]}
              accessibilityRole="button"
              accessibilityLabel={config.action.label}
              testID={config.testID ? `${config.testID}-action` : undefined}
            >
              <Text style={actionTextStyle}>{config.action.label}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ComponentWrapper>
  )
}
