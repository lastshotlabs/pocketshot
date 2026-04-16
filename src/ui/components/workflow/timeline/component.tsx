import React, { useCallback } from 'react'
import { ActivityIndicator, FlatList, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useComponentData } from '../../_base/useComponentData'
import type { TimelineConfig, TimelineItem } from './types'

const DOT_SIZE = 12
const LINE_WIDTH = 2

function resolveItemColor(color: string | undefined, tokens: ReturnType<typeof useTokens>): string {
  if (!color) {
    return tokens.colors.primary
  }

  const tokenColor = (tokens.colors as unknown as Record<string, string>)[color]
  return tokenColor ?? color
}

export function Timeline({ config }: { config: TimelineConfig }) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const { data: fetchedItems, isLoading } = useComponentData<TimelineItem[]>(config.data)

  const staticItems = config.items ?? []
  const remoteItems = Array.isArray(fetchedItems) ? fetchedItems : []
  const allItems = [...staticItems, ...remoteItems]

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
    typeof sharedTextStyle.letterSpacing === 'number'
      ? sharedTextStyle.letterSpacing
      : undefined

  const renderItem = useCallback(
    ({ item, index }: { item: TimelineItem; index: number }) => {
      const isLast = index === allItems.length - 1
      const markerColor = resolveItemColor(item.color, tokens)

      const itemSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.item as Record<string, unknown> | undefined,
        itemSurface: item.slots?.item as Record<string, unknown> | undefined,
      })
      const markerColumnSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.markerColumn as Record<string, unknown> | undefined,
        itemSurface: item.slots?.markerColumn as Record<string, unknown> | undefined,
      })
      const markerSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.marker as Record<string, unknown> | undefined,
        itemSurface: item.slots?.marker as Record<string, unknown> | undefined,
      })
      const itemIconSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.itemIcon as Record<string, unknown> | undefined,
        itemSurface: item.slots?.itemIcon as Record<string, unknown> | undefined,
      })
      const connectorSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.connector as Record<string, unknown> | undefined,
        itemSurface: item.slots?.connector as Record<string, unknown> | undefined,
      })
      const bodySurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.body as Record<string, unknown> | undefined,
        itemSurface: item.slots?.body as Record<string, unknown> | undefined,
      })
      const headerSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.header as Record<string, unknown> | undefined,
        itemSurface: item.slots?.header as Record<string, unknown> | undefined,
      })
      const titleGroupSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.titleGroup as Record<string, unknown> | undefined,
        itemSurface: item.slots?.titleGroup as Record<string, unknown> | undefined,
      })
      const titleSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.title as Record<string, unknown> | undefined,
        itemSurface: item.slots?.title as Record<string, unknown> | undefined,
      })
      const descriptionSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.description as Record<string, unknown> | undefined,
        itemSurface: item.slots?.description as Record<string, unknown> | undefined,
      })
      const metaSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.meta as Record<string, unknown> | undefined,
        itemSurface: item.slots?.meta as Record<string, unknown> | undefined,
      })
      const contentSurface = resolveSurfacePresentation({
        tokens,
        componentSurface: config.slots?.content as Record<string, unknown> | undefined,
        itemSurface: item.slots?.content as Record<string, unknown> | undefined,
      })

      const itemRowStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'flex-start',
      }
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
      const bodyStyle: ViewStyle = {
        flex: 1,
        paddingBottom: tokens.spacing[4],
      }
      const headerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }
      const titleGroupStyle: ViewStyle = {
        flex: 1,
      }
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
                <Text
                  style={[descriptionStyle, descriptionSurface.style as TextStyle | undefined]}
                >
                  {item.description}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )
    },
    [allItems.length, config, sharedTextStyle, textAlign, lineHeight, letterSpacing, baseFontSize, baseColor, tokens],
  )

  const keyExtractor = useCallback((item: TimelineItem) => item.id, [])

  if (isLoading && allItems.length === 0) {
    const loadingStyle: ViewStyle = {
      paddingVertical: tokens.spacing[4],
      alignItems: 'center',
    }
    const loadingSurface = resolveSurfacePresentation({
      tokens,
      componentSurface: config.slots?.loadingState as Record<string, unknown> | undefined,
    })

    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={[loadingStyle, loadingSurface.style as ViewStyle | undefined]}>
          <ActivityIndicator size="small" color={tokens.colors.primary} />
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        style={{ width: '100%' }}
      />
    </ComponentWrapper>
  )
}
