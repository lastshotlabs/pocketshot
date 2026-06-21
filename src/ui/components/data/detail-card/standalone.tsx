import React, { useEffect, useRef } from 'react'
import { Animated, Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type DetailCardFieldType = 'text' | 'badge' | 'link' | 'date' | 'email' | 'phone'

export interface DetailCardField {
  label: string
  value?: string
  type?: DetailCardFieldType
  /** Per-field slot overrides (field, fieldLabel, fieldValue). */
  slots?: Record<string, Record<string, unknown>>
}

export interface DetailCardSection {
  title?: string
  fields: DetailCardField[]
}

export interface DetailCardBaseProps {
  /** Card title (rendered as header). */
  title?: string
  /** Card subtitle (under the title). */
  subtitle?: string
  /** When true, renders skeleton loaders instead of content. */
  loading?: boolean
  /** Sections of fields to render. */
  sections: DetailCardSection[]
  /** Edit button handler. When provided, renders an "Edit" button in the header. */
  onEditPress?: () => void
  /** Called when a link/email/phone field is pressed. Receives the URL. */
  onLinkPress?: (url: string) => void
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function FieldSkeleton({ tokens }: { tokens: DesignTokens }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tokens.spacing[4],
        paddingVertical: tokens.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.divider,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={{
          width: 100,
          height: 12,
          borderRadius: tokens.radius.sm,
          backgroundColor: tokens.colors.surfaceAlt,
          opacity,
          marginRight: tokens.spacing[4],
        }}
      />
      <Animated.View
        style={{
          flex: 1,
          height: 12,
          borderRadius: tokens.radius.sm,
          backgroundColor: tokens.colors.surfaceAlt,
          opacity,
        }}
      />
    </View>
  )
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function FieldValue({
  type,
  value,
  tokens,
  onLinkPress,
  testID,
  textStyle,
}: {
  type: DetailCardFieldType
  value: string
  tokens: DesignTokens
  onLinkPress?: (url: string) => void
  testID?: string
  textStyle: TextStyle
}) {
  if (type === 'badge') {
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: tokens.colors.badgeBackground,
          borderRadius: tokens.radius.full,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
        accessibilityRole="text"
      >
        <Text
          style={{
            fontSize: textStyle.fontSize ?? tokens.typography.fontSizeSm,
            color: tokens.colors.badgeForeground,
            fontWeight: tokens.typography.fontWeightMedium,
          }}
        >
          {value}
        </Text>
      </View>
    )
  }

  if (type === 'link') {
    return (
      <TouchableOpacity
        onPress={() => onLinkPress?.(value)}
        accessibilityRole="link"
        accessibilityLabel={value}
        testID={testID}
      >
        <Text style={[textStyle, { color: tokens.colors.primary, textDecorationLine: 'underline' }]}>
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  if (type === 'date') {
    return (
      <Text style={textStyle} accessibilityRole="text">
        {formatDate(value)}
      </Text>
    )
  }

  if (type === 'email') {
    return (
      <TouchableOpacity
        onPress={() => onLinkPress?.(`mailto:${value}`)}
        accessibilityRole="link"
        accessibilityLabel={`Email ${value}`}
        testID={testID}
      >
        <Text style={[textStyle, { color: tokens.colors.primary, textDecorationLine: 'underline' }]}>
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  if (type === 'phone') {
    return (
      <TouchableOpacity
        onPress={() => onLinkPress?.(`tel:${value}`)}
        accessibilityRole="link"
        accessibilityLabel={`Call ${value}`}
        testID={testID}
      >
        <Text style={[textStyle, { color: tokens.colors.primary, textDecorationLine: 'underline' }]}>
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <Text style={textStyle} accessibilityRole="text">
      {value}
    </Text>
  )
}

/**
 * Standalone DetailCard — plain React props, no manifest required.
 *
 * @example
 * <DetailCardBase title="Profile" sections={[{ fields: [{ label: "Email", value: "x@y.com", type: "email" }] }]} />
 */
export function DetailCardBase({
  title,
  subtitle,
  loading,
  sections,
  onEditPress,
  onLinkPress,
  slots,
  style,
  testID,
}: DetailCardBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const panelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.panel })
  const headerSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.header })
  const titleSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.title })
  const actionsSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.actions })
  const actionButtonSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.actionButton,
  })
  const fieldsSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.fields })
  const loadingSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.loadingState,
  })

  const titleStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeLg,
    color: tokens.colors.text,
    fontWeight: tokens.typography.fontWeightSemibold,
  }
  const subtitleStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    marginTop: tokens.spacing[1],
  }
  const buttonTextStyle: TextStyle = {
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.text,
    fontWeight: tokens.typography.fontWeightMedium,
  }
  const fieldLabelStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeightMedium,
  }
  const fieldValueTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.text,
  }

  const skeletonCount = sections.reduce((acc, s) => acc + s.fields.length, 0)
  const panelStyle: ViewStyle = {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    ...tokens.shadows.sm,
    ...style,
  }
  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.divider,
  }
  const titleGroupStyle: ViewStyle = { flex: 1 }
  const actionsStyle: ViewStyle = { marginLeft: tokens.spacing[3] }
  const actionButtonStyle: ViewStyle = {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  }

  return (
    <View style={[panelStyle, panelSurface.style as ViewStyle | undefined]} testID={testID}>
      {(title || subtitle || onEditPress) && (
        <View style={[headerStyle, headerSurface.style as ViewStyle | undefined]}>
          <View style={titleGroupStyle}>
            {title ? (
              <Text
                style={[titleStyle, titleSurface.style as TextStyle | undefined]}
                accessibilityRole="header"
              >
                {title}
              </Text>
            ) : null}
            {subtitle ? <Text style={subtitleStyle}>{subtitle}</Text> : null}
          </View>
          {onEditPress ? (
            <View style={[actionsStyle, actionsSurface.style as ViewStyle | undefined]}>
              <TouchableOpacity
                onPress={onEditPress}
                style={[actionButtonStyle, actionButtonSurface.style as ViewStyle | undefined]}
                accessibilityRole="button"
                accessibilityLabel="Edit"
                testID={testID ? `${testID}-edit` : 'detail-card-edit'}
              >
                <Text style={buttonTextStyle}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}

      {loading ? (
        <View style={loadingSurface.style as ViewStyle | undefined}>
          {Array.from({ length: Math.max(skeletonCount, 3) }, (_, i) => (
            <FieldSkeleton key={i} tokens={tokens} />
          ))}
        </View>
      ) : (
        <View style={fieldsSurface.style as ViewStyle | undefined}>
          {sections.map((section, sectionIdx) => (
            <View key={sectionIdx}>
              {section.title ? (
                <View
                  style={{
                    paddingHorizontal: tokens.spacing[4],
                    paddingVertical: tokens.spacing[2],
                    backgroundColor: tokens.colors.surfaceAlt,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSizeSm,
                      fontWeight: tokens.typography.fontWeightSemibold,
                      color: tokens.colors.textMuted,
                      letterSpacing: 0.8,
                    }}
                  >
                    {section.title.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              {section.fields.map((field, fieldIdx) => {
                const displayValue = field.value ?? ''
                const isLast =
                  fieldIdx === section.fields.length - 1 &&
                  sectionIdx === sections.length - 1
                const fieldTestID = testID
                  ? `${testID}-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`
                  : `detail-card-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`

                const fieldSurface = resolveSurfacePresentation({
                  tokens,
                  componentSurface: slots?.field,
                  itemSurface: field.slots?.field,
                })
                const fieldLabelSurface = resolveSurfacePresentation({
                  tokens,
                  componentSurface: slots?.fieldLabel,
                  itemSurface: field.slots?.fieldLabel,
                })
                const fieldValueSurface = resolveSurfacePresentation({
                  tokens,
                  componentSurface: slots?.fieldValue,
                  itemSurface: field.slots?.fieldValue,
                })

                const fieldRowStyle: ViewStyle = {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: tokens.spacing[4],
                  paddingVertical: tokens.spacing[3],
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: tokens.colors.divider,
                }

                return (
                  <View
                    key={fieldIdx}
                    style={[fieldRowStyle, fieldSurface.style as ViewStyle | undefined]}
                    accessibilityRole="text"
                    accessibilityLabel={`${field.label}: ${displayValue}`}
                  >
                    <View
                      style={{ width: 120, flexShrink: 0, marginRight: tokens.spacing[3] }}
                    >
                      <Text
                        style={[fieldLabelStyle, fieldLabelSurface.style as TextStyle | undefined]}
                        numberOfLines={1}
                      >
                        {field.label}
                      </Text>
                    </View>
                    <View
                      style={[
                        { flex: 1 },
                        fieldValueSurface.style as ViewStyle | undefined,
                      ]}
                    >
                      <FieldValue
                        type={field.type ?? 'text'}
                        value={displayValue}
                        tokens={tokens}
                        onLinkPress={onLinkPress}
                        testID={fieldTestID}
                        textStyle={fieldValueTextStyle}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
