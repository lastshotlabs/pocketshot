import React, { useCallback, useMemo, useState } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

export interface AlertBaseProps {
  /** Alert title (heading). */
  title: string
  /** Optional descriptive body text. */
  body?: string
  /** Variant — controls color tone. */
  variant?: AlertVariant
  /** Override the icon glyph. */
  icon?: string
  /** When true, shows a dismiss button. */
  dismissible?: boolean
  /** Called when dismiss button is pressed (after the alert hides itself). */
  onDismiss?: () => void
  /** Optional action button. */
  action?: { label: string; onPress: () => void }
  /** Slot overrides (root, content, icon, title, description, dismiss, action). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

const DEFAULT_ICONS: Record<AlertVariant, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
  default: '•',
}

function resolveVariantColors(
  variant: AlertVariant,
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

/**
 * Standalone Alert — plain React props, no manifest required.
 *
 * @example
 * <AlertBase title="Saved" body="Your changes have been saved." variant="success" />
 */
export function AlertBase({
  title,
  body,
  variant = 'default',
  icon,
  dismissible,
  onDismiss,
  action,
  slots,
  style,
  testID,
}: AlertBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [dismissed, setDismissed] = useState(false)

  const variantColors = useMemo(() => resolveVariantColors(variant, tokens), [variant, tokens])

  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const contentSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.content })
  const iconSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.icon })
  const titleSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.title })
  const descriptionSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.description,
  })
  const dismissSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.dismiss })
  const actionSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.action })

  const resolvedIcon = icon ?? DEFAULT_ICONS[variant]

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    onDismiss?.()
  }, [onDismiss])

  if (dismissed) return null

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    borderRadius: tokens.radius.md,
    backgroundColor: variantColors.backgroundColor,
    overflow: 'hidden',
    ...style,
  }
  const accentStyle: ViewStyle = { width: 4, backgroundColor: variantColors.accentColor }
  const contentStyle: ViewStyle = {
    flex: 1,
    padding: tokens.spacing[3],
    paddingLeft: tokens.spacing[3],
  }
  const headerRowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'flex-start' }
  const iconStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: variantColors.accentColor,
    marginRight: tokens.spacing[2],
    lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
  }
  const titleRowStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
  const titleStyle: TextStyle = {
    ...sharedTextStyle,
    flex: 1,
    fontSize: tokens.typography.fontSizeSm,
    fontWeight: tokens.typography.fontWeightSemibold,
    color: variantColors.textColor,
    lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
  }
  const dismissButtonStyle: ViewStyle = {
    marginLeft: tokens.spacing[2],
    padding: tokens.spacing[1],
  }
  const dismissTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
  }
  const bodyStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: variantColors.bodyColor,
    marginTop: tokens.spacing[1],
    lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightRelaxed,
  }
  const actionButtonStyle: ViewStyle = {
    marginTop: tokens.spacing[2],
    alignSelf: 'flex-start',
  }
  const actionTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    fontWeight: tokens.typography.fontWeightSemibold,
    color: variantColors.accentColor,
  }

  return (
    <View
      style={[containerStyle, rootSurface.style as ViewStyle | undefined]}
      accessibilityRole="alert"
      accessibilityLabel={`${title}${body ? '. ' + body : ''}`}
      testID={testID}
    >
      <View style={accentStyle} />
      <View style={[contentStyle, contentSurface.style as ViewStyle | undefined]}>
        <View style={headerRowStyle}>
          <Text
            style={[iconStyle, iconSurface.style as TextStyle | undefined]}
            accessibilityElementsHidden
          >
            {resolvedIcon}
          </Text>
          <View style={titleRowStyle}>
            <Text style={[titleStyle, titleSurface.style as TextStyle | undefined]}>{title}</Text>
            {dismissible ? (
              <TouchableOpacity
                onPress={handleDismiss}
                style={[dismissButtonStyle, dismissSurface.style as ViewStyle | undefined]}
                accessibilityRole="button"
                accessibilityLabel="Dismiss alert"
                testID={testID ? `${testID}-dismiss` : undefined}
              >
                <Text style={dismissTextStyle}>×</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        {body ? (
          <Text style={[bodyStyle, descriptionSurface.style as TextStyle | undefined]}>{body}</Text>
        ) : null}
        {action ? (
          <TouchableOpacity
            onPress={action.onPress}
            style={[actionButtonStyle, actionSurface.style as ViewStyle | undefined]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            testID={testID ? `${testID}-action` : undefined}
          >
            <Text style={actionTextStyle}>{action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}
