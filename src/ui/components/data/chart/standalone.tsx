import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type ChartType = 'bar' | 'line' | 'donut' | 'pie'

export interface ChartDataItem {
  label: string
  value: number
  color?: string
}

export interface ChartBaseProps {
  /** Chart variant. */
  type?: ChartType
  /** Series data. */
  data: ChartDataItem[]
  /** Optional title above the chart. */
  title?: string
  /** Chart drawing area height (in pixels). */
  height?: number
  /** Show numeric labels along axes. */
  showLabels?: boolean
  /** Show numeric values on data points. */
  showValues?: boolean
  /** Show legend below the chart. */
  showLegend?: boolean
  /** Animate transitions. */
  animated?: boolean
  /** Slot overrides (legend, legendItem, series, axis). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

let SvgComponents: { Svg: any; Path: any; G: any; Circle: any } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const svg = require('react-native-svg')
  SvgComponents = { Svg: svg.Svg, Path: svg.Path, G: svg.G, Circle: svg.Circle }
} catch {
  SvgComponents = null
}

function getPaletteColor(index: number, tokens: DesignTokens): string {
  const palette = [
    tokens.colors.primary,
    tokens.colors.success,
    tokens.colors.warning,
    tokens.colors.info,
    tokens.colors.error,
    tokens.colors.secondary,
    tokens.colors.accent,
  ]
  return palette[index % palette.length]!
}

function Legend({
  data,
  tokens,
  styles,
  legendStyle,
  legendItemStyle,
  axisTextStyle,
}: {
  data: ChartDataItem[]
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  legendStyle?: ViewStyle
  legendItemStyle?: ViewStyle
  axisTextStyle?: TextStyle
}) {
  return (
    <View
      style={[styles.legend, legendStyle]}
      accessibilityRole="list"
      accessibilityLabel="Chart legend"
    >
      {data.map((item, i) => {
        const color = item.color ?? getPaletteColor(i, tokens)
        return (
          <View key={`${item.label}-${i}`} style={[styles.legendItem, legendItemStyle]}>
            <View style={[styles.legendSwatch, { backgroundColor: color }]} />
            <Text style={[styles.legendLabel, axisTextStyle]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function BarChart({
  data,
  height,
  showLabels,
  showValues,
  animated: shouldAnimate,
  tokens,
  styles,
  seriesStyle,
  axisTextStyle,
}: {
  data: ChartDataItem[]
  height: number
  showLabels: boolean
  showValues: boolean
  animated: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  seriesStyle?: ViewStyle
  axisTextStyle?: TextStyle
}) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!shouldAnimate) {
      progress.setValue(1)
      return
    }
    Animated.timing(progress, { toValue: 1, duration: 600, useNativeDriver: false }).start()
  }, [progress, shouldAnimate])

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 0.001), [data])

  const chartAreaHeight = height - (showLabels ? 28 : 0) - (showValues ? 20 : 0)

  return (
    <View
      style={{ height, width: '100%' }}
      accessibilityRole="image"
      accessibilityLabel={`Bar chart with ${data.length} items`}
    >
      <View style={styles.barChartContainer}>
        {data.map((item, i) => {
          const color = item.color ?? getPaletteColor(i, tokens)
          const barHeightRatio = item.value / maxValue

          return (
            <View key={`${item.label}-${i}`} style={styles.barColumn}>
              {showValues ? (
                <Text style={[styles.barValueLabel, axisTextStyle]} numberOfLines={1}>
                  {item.value}
                </Text>
              ) : null}

              <View style={[styles.barTrack, { height: chartAreaHeight }]}>
                <Animated.View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 2,
                    right: 2,
                    borderRadius: tokens.radius.sm,
                    backgroundColor: color,
                    height: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, chartAreaHeight * barHeightRatio],
                    }),
                    ...(seriesStyle ?? {}),
                  }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>

              {showLabels ? (
                <Text style={[styles.barLabel, axisTextStyle]} numberOfLines={1}>
                  {item.label}
                </Text>
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

function LineChart({
  data,
  height,
  showLabels,
  showValues,
  animated: shouldAnimate,
  tokens,
  styles,
  seriesStyle,
  axisTextStyle,
}: {
  data: ChartDataItem[]
  height: number
  showLabels: boolean
  showValues: boolean
  animated: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  seriesStyle?: ViewStyle
  axisTextStyle?: TextStyle
}) {
  const [containerWidth, setContainerWidth] = useState(0)
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!shouldAnimate) {
      progress.setValue(1)
      return
    }
    Animated.timing(progress, { toValue: 1, duration: 700, useNativeDriver: true }).start()
  }, [progress, shouldAnimate])

  const plotHeight = height - (showLabels ? 28 : 0) - (showValues ? 20 : 0)
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 0.001), [data])

  const points = useMemo(() => {
    if (containerWidth === 0 || data.length === 0) return []
    const step = containerWidth / Math.max(data.length - 1, 1)
    return data.map((item, i) => ({
      x: i * step,
      y: plotHeight - (item.value / maxValue) * plotHeight,
      item,
      index: i,
    }))
  }, [containerWidth, data, maxValue, plotHeight])

  const primaryColor = tokens.colors.primary

  return (
    <View
      style={{ height, width: '100%' }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      accessibilityRole="image"
      accessibilityLabel={`Line chart with ${data.length} data points`}
    >
      {containerWidth > 0 && points.length > 0 ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: plotHeight }}>
          {points.slice(0, -1).map((pt, i) => {
            const next = points[i + 1]!
            const dx = next.x - pt.x
            const dy = next.y - pt.y
            const length = Math.sqrt(dx * dx + dy * dy)
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI

            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: pt.x,
                  top: pt.y,
                  width: length,
                  height: 2,
                  backgroundColor: primaryColor,
                  opacity: 0.7,
                  transformOrigin: '0 1px',
                  transform: [{ rotate: `${angle}deg` }],
                  ...(seriesStyle ?? {}),
                }}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            )
          })}

          {points.map((pt) => {
            const color = pt.item.color ?? primaryColor
            return (
              <Animated.View
                key={pt.index}
                style={{
                  position: 'absolute',
                  left: pt.x - 4,
                  top: pt.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: color,
                  opacity: progress,
                  ...(seriesStyle ?? {}),
                }}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            )
          })}

          {showValues
            ? points.map((pt) => (
                <Text
                  key={pt.index}
                  style={[
                    styles.lineValueLabel,
                    axisTextStyle,
                    { position: 'absolute', left: pt.x - 20, top: pt.y - 18 },
                  ]}
                  numberOfLines={1}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {pt.item.value}
                </Text>
              ))
            : null}
        </View>
      ) : null}

      {showLabels && containerWidth > 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 28,
            flexDirection: 'row',
          }}
        >
          {points.map((pt) => (
            <View
              key={pt.index}
              style={{
                position: 'absolute',
                left: pt.x - 24,
                width: 48,
                alignItems: 'center',
              }}
            >
              <Text style={[styles.barLabel, axisTextStyle]} numberOfLines={1}>
                {pt.item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function DonutFallback({
  data,
  tokens,
  styles,
  legendItemStyle,
  seriesStyle,
  axisTextStyle,
}: {
  data: ChartDataItem[]
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  legendItemStyle?: ViewStyle
  seriesStyle?: ViewStyle
  axisTextStyle?: TextStyle
}) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0) || 1, [data])

  return (
    <View accessibilityRole="image" accessibilityLabel="Donut chart">
      {data.map((item, i) => {
        const color = item.color ?? getPaletteColor(i, tokens)
        const pct = Math.round((item.value / total) * 100)
        return (
          <View key={`${item.label}-${i}`} style={[styles.donutRow, legendItemStyle]}>
            <View style={[styles.donutSwatch, { backgroundColor: color }, seriesStyle]} />
            <Text style={[styles.donutLabel, axisTextStyle]} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.donutBarTrack}>
              <View
                style={[
                  styles.donutBarFill,
                  { width: `${pct}%` as `${number}%`, backgroundColor: color },
                  seriesStyle,
                ]}
              />
            </View>
            <Text style={[styles.donutPct, axisTextStyle]}>{pct}%</Text>
          </View>
        )
      })}
    </View>
  )
}

function DonutSvg({
  data,
  size,
  isDonut,
  tokens,
}: {
  data: ChartDataItem[]
  size: number
  isDonut: boolean
  tokens: DesignTokens
}) {
  if (!SvgComponents) return null
  const { Svg, Path } = SvgComponents

  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = isDonut ? outerR * 0.55 : 0

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: centerX + radius * Math.cos(rad), y: centerY + radius * Math.sin(rad) }
  }

  function slicePath(startAngle: number, endAngle: number): string {
    const sweep = endAngle - startAngle
    if (Math.abs(sweep) >= 360) {
      const top = polarToCartesian(cx, cy, outerR, startAngle)
      const bot = polarToCartesian(cx, cy, outerR, startAngle + 180)
      const iTop = polarToCartesian(cx, cy, innerR, startAngle)
      const iBot = polarToCartesian(cx, cy, innerR, startAngle + 180)
      if (innerR === 0) {
        return `M ${top.x} ${top.y} A ${outerR} ${outerR} 0 1 1 ${bot.x} ${bot.y} A ${outerR} ${outerR} 0 1 1 ${top.x} ${top.y} Z`
      }
      return `M ${top.x} ${top.y} A ${outerR} ${outerR} 0 1 1 ${bot.x} ${bot.y} A ${outerR} ${outerR} 0 1 1 ${top.x} ${top.y} M ${iTop.x} ${iTop.y} A ${innerR} ${innerR} 0 1 0 ${iBot.x} ${iBot.y} A ${innerR} ${innerR} 0 1 0 ${iTop.x} ${iTop.y} Z`
    }
    const large = sweep > 180 ? 1 : 0
    const s = polarToCartesian(cx, cy, outerR, startAngle)
    const e = polarToCartesian(cx, cy, outerR, endAngle)
    if (innerR === 0) {
      return `M ${cx} ${cy} L ${s.x} ${s.y} A ${outerR} ${outerR} 0 ${large} 1 ${e.x} ${e.y} Z`
    }
    const si = polarToCartesian(cx, cy, innerR, startAngle)
    const ei = polarToCartesian(cx, cy, innerR, endAngle)
    return `M ${s.x} ${s.y} A ${outerR} ${outerR} 0 ${large} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${innerR} ${innerR} 0 ${large} 0 ${si.x} ${si.y} Z`
  }

  let currentAngle = 0
  const slices = data.map((item, i) => {
    const sliceDeg = (item.value / total) * 360
    const path = slicePath(currentAngle, currentAngle + sliceDeg)
    const color = item.color ?? getPaletteColor(i, tokens)
    currentAngle += sliceDeg
    return { path, color, item }
  })

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <Path key={i} d={slice.path} fill={slice.color} />
      ))}
    </Svg>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    wrapper: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[4],
      ...tokens.shadows.sm,
    },
    title: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[3],
    },
    barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', flex: 1 },
    barColumn: { flex: 1, alignItems: 'center' },
    barTrack: { width: '100%', position: 'relative' },
    barLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      marginTop: tokens.spacing[1],
    },
    barValueLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      marginBottom: 2,
    },
    lineValueLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      width: 40,
    },
    donutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    donutSwatch: {
      width: 10,
      height: 10,
      borderRadius: tokens.radius.sm,
      flexShrink: 0,
    },
    donutLabel: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      width: 80,
      flexShrink: 0,
    },
    donutBarTrack: {
      flex: 1,
      height: 8,
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.full,
      overflow: 'hidden',
    },
    donutBarFill: { height: '100%', borderRadius: tokens.radius.full },
    donutPct: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      width: 36,
      textAlign: 'right',
      flexShrink: 0,
    },
    svgChartContainer: { alignItems: 'center' },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing[2],
      marginTop: tokens.spacing[3],
      paddingTop: tokens.spacing[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.divider,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
    },
    legendSwatch: { width: 10, height: 10, borderRadius: tokens.radius.sm },
    legendLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      maxWidth: 80,
    },
    emptyState: { alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: tokens.typography.fontSizeSm, color: tokens.colors.textMuted },
  })
}

/**
 * Standalone Chart — plain React props, no manifest required.
 *
 * @example
 * <ChartBase type="bar" data={[{ label: 'A', value: 3 }, { label: 'B', value: 7 }]} />
 */
export function ChartBase({
  type = 'bar',
  data,
  title,
  height = 200,
  showLabels = true,
  showValues = false,
  showLegend,
  animated = true,
  slots,
  style,
  testID,
}: ChartBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const isEmpty = data.length === 0

  const legendSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.legend })
  const legendItemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.legendItem,
  })
  const seriesSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.series })
  const axisSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.axis })

  const renderChart = useCallback(() => {
    if (isEmpty) {
      return (
        <View style={[styles.emptyState, { height }]}>
          <Text style={[styles.emptyText, axisSurface.style as TextStyle | undefined]}>
            No data
          </Text>
        </View>
      )
    }

    switch (type) {
      case 'bar':
        return (
          <BarChart
            data={data}
            height={height}
            showLabels={showLabels}
            showValues={showValues}
            animated={animated}
            tokens={tokens}
            styles={styles}
            seriesStyle={seriesSurface.style as ViewStyle | undefined}
            axisTextStyle={axisSurface.style as TextStyle | undefined}
          />
        )
      case 'line':
        return (
          <LineChart
            data={data}
            height={height}
            showLabels={showLabels}
            showValues={showValues}
            animated={animated}
            tokens={tokens}
            styles={styles}
            seriesStyle={seriesSurface.style as ViewStyle | undefined}
            axisTextStyle={axisSurface.style as TextStyle | undefined}
          />
        )
      case 'donut':
      case 'pie': {
        if (SvgComponents) {
          const svgSize = Math.min(height, 200)
          return (
            <View style={styles.svgChartContainer}>
              <DonutSvg data={data} size={svgSize} isDonut={type === 'donut'} tokens={tokens} />
            </View>
          )
        }
        return (
          <DonutFallback
            data={data}
            tokens={tokens}
            styles={styles}
            legendItemStyle={legendItemSurface.style as ViewStyle | undefined}
            seriesStyle={seriesSurface.style as ViewStyle | undefined}
            axisTextStyle={axisSurface.style as TextStyle | undefined}
          />
        )
      }
    }
  }, [
    animated,
    axisSurface.style,
    data,
    height,
    isEmpty,
    legendItemSurface.style,
    seriesSurface.style,
    showLabels,
    showValues,
    styles,
    tokens,
    type,
  ])

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {renderChart()}
      {showLegend && !isEmpty ? (
        <Legend
          data={data}
          tokens={tokens}
          styles={styles}
          legendStyle={legendSurface.style as ViewStyle | undefined}
          legendItemStyle={legendItemSurface.style as ViewStyle | undefined}
          axisTextStyle={axisSurface.style as TextStyle | undefined}
        />
      ) : null}
    </View>
  )
}
