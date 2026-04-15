import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, toNumericDimensionValue } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ChartConfig, ChartDataItem } from './types'

// ── Optional SVG import ────────────────────────────────────────────────────────

let SvgComponents: { Svg: any; Path: any; G: any; Circle: any } | null = null
try {
  const svg = require('react-native-svg')
  SvgComponents = { Svg: svg.Svg, Path: svg.Path, G: svg.G, Circle: svg.Circle }
} catch {
  SvgComponents = null
}

// ── Token-derived color palette ────────────────────────────────────────────────

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

// ── Legend ─────────────────────────────────────────────────────────────────────

function Legend({
  data,
  tokens,
  styles,
}: {
  data: ChartDataItem[]
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
}) {
  return (
    <View style={styles.legend} accessibilityRole="list" accessibilityLabel="Chart legend">
      {data.map((item, i) => {
        const color = item.color ?? getPaletteColor(i, tokens)
        return (
          <View key={`${item.label}-${i}`} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

// ── Bar chart ──────────────────────────────────────────────────────────────────

function BarChart({
  data,
  height,
  showLabels,
  showValues,
  animated: shouldAnimate,
  tokens,
  styles,
}: {
  data: ChartDataItem[]
  height: number
  showLabels: boolean
  showValues: boolean
  animated: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
}) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!shouldAnimate) {
      progress.setValue(1)
      return
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false, // height animation requires JS driver
    }).start()
  }, [progress, shouldAnimate])

  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 0.001),
    [data],
  )

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
              {/* Value label above bar */}
              {showValues ? (
                <Text style={styles.barValueLabel} numberOfLines={1}>
                  {item.value}
                </Text>
              ) : null}

              {/* Bar container — fixed height, bar grows from bottom */}
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
                  }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>

              {/* Label below bar */}
              {showLabels ? (
                <Text style={styles.barLabel} numberOfLines={1}>
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

// ── Line chart ─────────────────────────────────────────────────────────────────

function LineChart({
  data,
  height,
  showLabels,
  showValues,
  animated: shouldAnimate,
  tokens,
  styles,
}: {
  data: ChartDataItem[]
  height: number
  showLabels: boolean
  showValues: boolean
  animated: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
}) {
  const [containerWidth, setContainerWidth] = useState(0)
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!shouldAnimate) {
      progress.setValue(1)
      return
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start()
  }, [progress, shouldAnimate])

  const plotHeight = height - (showLabels ? 28 : 0) - (showValues ? 20 : 0)
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 0.001),
    [data],
  )

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
          {/* Connecting line segments */}
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
                }}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            )
          })}

          {/* Data point dots */}
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
                }}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            )
          })}

          {/* Value labels */}
          {showValues
            ? points.map((pt) => (
                <Text
                  key={pt.index}
                  style={[
                    styles.lineValueLabel,
                    {
                      position: 'absolute',
                      left: pt.x - 20,
                      top: pt.y - 18,
                    },
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

      {/* Labels row */}
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
              <Text style={styles.barLabel} numberOfLines={1}>
                {pt.item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

// ── Donut / Pie (SVG or fallback) ──────────────────────────────────────────────

function DonutFallback({
  data,
  tokens,
  styles,
}: {
  data: ChartDataItem[]
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
}) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0) || 1, [data])

  return (
    <View accessibilityRole="image" accessibilityLabel="Donut chart">
      {data.map((item, i) => {
        const color = item.color ?? getPaletteColor(i, tokens)
        const pct = Math.round((item.value / total) * 100)
        return (
          <View key={`${item.label}-${i}`} style={styles.donutRow}>
            <View style={[styles.donutSwatch, { backgroundColor: color }]} />
            <Text style={styles.donutLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.donutBarTrack}>
              <View
                style={[
                  styles.donutBarFill,
                  { width: `${pct}%` as `${number}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.donutPct}>{pct}%</Text>
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

  function polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleDeg: number,
  ) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: centerX + radius * Math.cos(rad), y: centerY + radius * Math.sin(rad) }
  }

  function slicePath(startAngle: number, endAngle: number): string {
    const sweep = endAngle - startAngle
    if (Math.abs(sweep) >= 360) {
      // Full circle — draw two half arcs
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

// ── Chart (main) ───────────────────────────────────────────────────────────────

export function Chart({ config }: { config: ChartConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()
  const styles = makeStyles(tokens)

  const resolvedData = useMemo<ChartDataItem[]>(() => {
    if (isFromRef(config.data)) {
      const ref = resolveFromRef(config.data, values)
      return Array.isArray(ref) ? (ref as ChartDataItem[]) : []
    }
    return config.data as ChartDataItem[]
  }, [config.data, values])

  const isEmpty = resolvedData.length === 0

  const chartType = config.type ?? 'bar'
  const height = useMemo(() => resolveChartHeight(tokens, config), [config, tokens])

  const renderChart = useCallback(() => {
    if (isEmpty) {
      return (
        <View style={[styles.emptyState, { height }]}>
          <Text style={styles.emptyText}>No data</Text>
        </View>
      )
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart
            data={resolvedData}
            height={height}
            showLabels={config.showLabels ?? true}
            showValues={config.showValues ?? false}
            animated={config.animated ?? true}
            tokens={tokens}
            styles={styles}
          />
        )

      case 'line':
        return (
          <LineChart
            data={resolvedData}
            height={height}
            showLabels={config.showLabels ?? true}
            showValues={config.showValues ?? false}
            animated={config.animated ?? true}
            tokens={tokens}
            styles={styles}
          />
        )

      case 'donut':
      case 'pie': {
        if (SvgComponents) {
          const svgSize = Math.min(height, 200)
          return (
            <View style={styles.svgChartContainer}>
              <DonutSvg
                data={resolvedData}
                size={svgSize}
                isDonut={chartType === 'donut'}
                tokens={tokens}
              />
            </View>
          )
        }
        // Fallback: horizontal bar representation
        return <DonutFallback data={resolvedData} tokens={tokens} styles={styles} />
      }
    }
  }, [chartType, config, height, isEmpty, resolvedData, styles, tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.wrapper} testID={config.testID}>
        {config.title ? <Text style={styles.title}>{config.title}</Text> : null}
        {renderChart()}
        {config.showLegend && !isEmpty ? (
          <Legend data={resolvedData} tokens={tokens} styles={styles} />
        ) : null}
      </View>
    </ComponentWrapper>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
    // Bar chart
    barChartContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      flex: 1,
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
    },
    barTrack: {
      width: '100%',
      position: 'relative',
    },
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
    // Line chart
    lineValueLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      width: 40,
    },
    // Donut fallback
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
    donutBarFill: {
      height: '100%',
      borderRadius: tokens.radius.full,
    },
    donutPct: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      width: 36,
      textAlign: 'right',
      flexShrink: 0,
    },
    // SVG chart container
    svgChartContainer: {
      alignItems: 'center',
    },
    // Legend
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
    legendSwatch: {
      width: 10,
      height: 10,
      borderRadius: tokens.radius.sm,
    },
    legendLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      maxWidth: 80,
    },
    // Empty
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
  })
}

function resolveChartHeight(tokens: DesignTokens, config: ChartConfig): number {
  const resolvedStyle = resolveNativeStyleProps({ height: config.height }, tokens)
  return toNumericDimensionValue(resolvedStyle.height) ?? 200
}

