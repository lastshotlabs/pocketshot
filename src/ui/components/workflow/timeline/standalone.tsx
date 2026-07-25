import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const DOT_SIZE = 12
const LINE_WIDTH = 2

export interface TimelineBaseItem {
  id: string
  title: string
  description?: string
  timestamp?: string
  icon?: string
  color?: string
  slots?: Record<string, Record<string, unknown>>
}

export interface TimelineBaseProps {
  /** Items to render. */
  items: TimelineBaseItem[]
  /** Show a loading indicator instead of the list. */
  loading?: boolean
  /** Slot overrides applied to every item. */
  slots?: Record<string, Record<string, unknown>>
  /** Called when an item is pressed. */
  onItemPress?: (item: TimelineBaseItem) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

function resolveItemColor(color: string | undefined, tokens: DesignTokens): string {
  if (!color) return tokens.colors.primary
  const tokenColor = (tokens.colors as unknown as Record<string, string>)[color]
  return tokenColor ?? color
}

/**
 * Standalone Timeline — plain React props, no manifest required.
 *
 * @example
 * <TimelineBase items={[{ id: '1', title: 'Started', timestamp: '2024-01-01' }]} />
 */
export function TimelineBase({
  items,
  loading,
  slots,
  onItemPress,
  style,
  testID,
  id,
}: TimelineBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const baseFontSize =
    typeof sharedTextStyle.fontSize === 'number'
      ? sharedTextStyle.fontSize
      : tokens.typography.fontSizeMd
  const baseColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text
  const textAlign =
    sharedTextStyle.textAlign === 'center' ||
    sharedTextStyle.textAlign === 'right' ||
    sharedTextStyle.textAlign === 'justify'
      ? sharedTextStyle.textAlign
      : 'left'
  const lineHeight =
    typeof sharedTextStyle.lineHeight === 'number'
      ? sharedTextStyle.lineHeight
      : baseFontSize * tokens.typography.lineHeightNormal
  const letterSpacing =
    typeof sharedTextStyle.letterSpacing === 'number' ? sharedTextStyle.letterSpacing : undefined

  const renderItem = useCallback(
    ({ item, index }: { item: TimelineBaseItem; index: number }) => {
      const isLast = index === items.length - 1
      const markerColor = resolveItemColor(item.color, tokens)

      const itemSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.item,
        itemSurface: item.slots?.item,
      })
      const markerColumnSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.markerColumn,
        itemSurface: item.slots?.markerColumn,
      })
      const markerSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.marker,
        itemSurface: item.slots?.marker,
      })
      const itemIconSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.itemIcon,
        itemSurface: item.slots?.itemIcon,
      })
      const connectorSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.connector,
        itemSurface: item.slots?.connector,
      })
      const bodySurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.body,
        itemSurface: item.slots?.body,
      })
      const headerSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.header,
        itemSurface: item.slots?.header,
      })
      const titleGroupSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.titleGroup,
        itemSurface: item.slots?.titleGroup,
      })
      const titleSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.title,
        itemSurface: item.slots?.title,
      })
      const descriptionSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.description,
        itemSurface: item.slots?.description,
      })
      const metaSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.meta,
        itemSurface: item.slots?.meta,
      })
      const contentSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: slots?.content,
        itemSurface: item.slots?.content,
      })

      const itemRowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'flex-start' }
      const markerColumnStyle: ViewStyle = {
        alignItems: 'center',
        width: DOT_SIZE + tokens.spacing[3],
        marginRight: tokens.spacing[3],
      }
      const markerStyle: ViewStyle = {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 3,
        backgroundColor: markerColor,
      }
      const iconStyle: TextStyle = {
        fontSize: 8,
        lineHeight: 10,
        color: tokens.colors.textInverse,
      }
      const connectorStyle: ViewStyle = {
        width: LINE_WIDTH,
        flex: 1,
        minHeight: tokens.spacing[6],
        backgroundColor: tokens.colors.border,
        marginTop: tokens.spacing[1],
      }
      const bodyStyle: ViewStyle = { flex: 1, paddingBottom: tokens.spacing[4] }
      const headerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }
      const titleGroupStyle: ViewStyle = { flex: 1 }
      const titleStyle: TextStyle = {
        fontSize: baseFontSize,
        color: baseColor,
        fontWeight:
          typeof sharedTextStyle.fontWeight === 'string'
            ? sharedTextStyle.fontWeight
            : tokens.typography.fontWeightSemibold,
        textAlign,
        lineHeight,
        letterSpacing,
      }
      const descriptionStyle: TextStyle = {
        fontSize: Math.max(baseFontSize - 2, tokens.typography.fontSizeXs),
        color: typeof sharedTextStyle.color === 'string' ? baseColor : tokens.colors.textMuted,
        marginTop: tokens.spacing[1],
        lineHeight: Math.max(lineHeight - 2, tokens.typography.fontSizeSm),
        textAlign,
        letterSpacing,
      }
      const metaStyle: TextStyle = {
        fontSize: Math.max(baseFontSize - 4, tokens.typography.fontSizeXs),
        color: typeof sharedTextStyle.color === 'string' ? baseColor : tokens.colors.textMuted,
        marginLeft: tokens.spacing[2],
        textAlign,
        letterSpacing,
      }
      const contentStyle: ViewStyle = {}

      return (
        <View style={[itemRowStyle, itemSurface.style as ViewStyle | undefined]}>
          <View style={[markerColumnStyle, markerColumnSurface.style as ViewStyle | undefined]}>
            <View style={[markerStyle, markerSurface.style as ViewStyle | undefined]}>
              {item.icon != null ? (
                <Text
                  style={[iconStyle, itemIconSurface.style as TextStyle | undefined]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {item.icon}
                </Text>
              ) : null}
            </View>
            {!isLast ? (
              <View style={[connectorStyle, connectorSurface.style as ViewStyle | undefined]} />
            ) : null}
          </View>
          <View style={[bodyStyle, bodySurface.style as ViewStyle | undefined]}>
            <View style={[headerStyle, headerSurface.style as ViewStyle | undefined]}>
              <View style={[titleGroupStyle, titleGroupSurface.style as ViewStyle | undefined]}>
                <Text style={[titleStyle, titleSurface.style as TextStyle | undefined]}>
                  {item.title}
                </Text>
              </View>
              {item.timestamp != null ? (
                <Text style={[metaStyle, metaSurface.style as TextStyle | undefined]}>
                  {item.timestamp}
                </Text>
              ) : null}
            </View>
            {item.description != null ? (
              <View style={[contentStyle, contentSurface.style as ViewStyle | undefined]}>
                <Text style={[descriptionStyle, descriptionSurface.style as TextStyle | undefined]}>
                  {item.description}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )
    },
    [
      items.length,
      slots,
      sharedTextStyle,
      textAlign,
      lineHeight,
      letterSpacing,
      baseFontSize,
      baseColor,
      tokens,
    ],
  )

  const keyExtractor = useCallback((item: TimelineBaseItem) => item.id, [])

  if (loading && items.length === 0) {
    const loadingStyle: ViewStyle = {
      paddingVertical: tokens.spacing[4],
      alignItems: 'center',
    }
    const loadingSurface = resolveSurfacePresentation({
      tokens,
      componentSurface: slots?.loadingState,
    })
    return (
      <View
        style={[loadingStyle, loadingSurface.style as ViewStyle | undefined, style]}
        testID={testID ?? id}
      >
        <ActivityIndicator size="small" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      renderItem={
        onItemPress
          ? ({ item, index }) => (
              <TouchableOpacity
                onPress={() => onItemPress(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                {renderItem({ item, index })}
              </TouchableOpacity>
            )
          : renderItem
      }
      keyExtractor={keyExtractor}
      scrollEnabled={false}
      style={[{ width: '100%' }, style]}
      testID={testID ?? id}
    />
  )
}
