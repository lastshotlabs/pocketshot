import React, { useCallback, useMemo, useRef } from 'react'
import { ScrollView, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import {
  resolveNativeStyleProps,
  resolveNativeTextStyle,
  resolveSurfacePresentation,
} from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { CompareViewConfig, DiffLine } from './types'

const DIFF_COLORS = {
  addedBg: 'rgba(34, 197, 94, 0.15)',
  addedText: '#22c55e',
  removedBg: 'rgba(239, 68, 68, 0.15)',
  removedText: '#ef4444',
  addedGutter: 'rgba(34, 197, 94, 0.3)',
  removedGutter: 'rgba(239, 68, 68, 0.3)',
} as const

const CODE_BG = '#1a1a2e'
const HEADER_BG = '#2d2d44'
const CODE_TEXT = '#e8e8e8'
const LINE_NUMBER_COLOR = '#666666'
const HEADER_TEXT_COLOR = '#aaaacc'
const DIVIDER_COLOR = '#3d3d5c'
const LINE_HEIGHT = 20

interface PanelLine {
  lineNum: number | null
  content: string
  type: 'unchanged' | 'added' | 'removed'
}

function computeDiff(leftLines: string[], rightLines: string[]): DiffLine[] {
  const leftCount = leftLines.length
  const rightCount = rightLines.length
  const table: number[][] = Array.from({ length: leftCount + 1 }, () =>
    Array.from({ length: rightCount + 1 }, () => 0),
  )

  for (let leftIndex = 1; leftIndex <= leftCount; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= rightCount; rightIndex += 1) {
      if (leftLines[leftIndex - 1] === rightLines[rightIndex - 1]) {
        table[leftIndex]![rightIndex] = table[leftIndex - 1]![rightIndex - 1]! + 1
      } else {
        table[leftIndex]![rightIndex] = Math.max(
          table[leftIndex - 1]![rightIndex]!,
          table[leftIndex]![rightIndex - 1]!,
        )
      }
    }
  }

  const stack: DiffLine[] = []
  let leftIndex = leftCount
  let rightIndex = rightCount

  while (leftIndex > 0 || rightIndex > 0) {
    if (
      leftIndex > 0 &&
      rightIndex > 0 &&
      leftLines[leftIndex - 1] === rightLines[rightIndex - 1]
    ) {
      stack.push({
        type: 'unchanged',
        leftLineNum: leftIndex,
        rightLineNum: rightIndex,
        content: leftLines[leftIndex - 1]!,
      })
      leftIndex -= 1
      rightIndex -= 1
      continue
    }

    if (
      rightIndex > 0 &&
      (leftIndex === 0 ||
        table[leftIndex]![rightIndex - 1]! >= table[leftIndex - 1]![rightIndex]!)
    ) {
      stack.push({
        type: 'added',
        leftLineNum: null,
        rightLineNum: rightIndex,
        content: rightLines[rightIndex - 1]!,
      })
      rightIndex -= 1
      continue
    }

    stack.push({
      type: 'removed',
      leftLineNum: leftIndex,
      rightLineNum: null,
      content: leftLines[leftIndex - 1]!,
    })
    leftIndex -= 1
  }

  return stack.reverse()
}

function resolveSlotSurface(
  config: CompareViewConfig,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface:
      (config.slots as Record<string, Record<string, unknown> | undefined> | undefined)?.[slot],
  })
}

function mergeTextStyle(
  sharedTextStyle: TextStyle,
  surface: ReturnType<typeof resolveSurfacePresentation>,
): TextStyle {
  return {
    ...sharedTextStyle,
    ...(surface.style as TextStyle | undefined),
  }
}

function InlineView({
  config,
  diff,
  showLineNumbers,
  highlightDiffs,
  sharedTextStyle,
  codeTextColor,
  headerTextColor,
}: {
  config: CompareViewConfig
  diff: DiffLine[]
  showLineNumbers: boolean
  highlightDiffs: boolean
  sharedTextStyle: TextStyle
  codeTextColor: string
  headerTextColor: string
}) {
  const tokens = useTokens()

  const inlineScrollSurface = resolveSlotSurface(config, tokens, 'inlineScroll', {
    maxHeight: 400,
  })
  const inlineContentSurface = resolveSlotSurface(config, tokens, 'inlineContent', {
    padding: 'sm',
  })
  const inlineGutterSurface = resolveSlotSurface(config, tokens, 'inlineGutter', {
    flexDirection: 'row',
    width: 64,
    marginRight: 'sm',
    paddingX: 'xs',
  })
  const inlineLineNumberSurface = resolveSlotSurface(config, tokens, 'inlineLineNumber', {
    color: LINE_NUMBER_COLOR,
    fontSize: 'xs',
    lineHeight: LINE_HEIGHT,
    width: 28,
    textAlign: 'right',
  })
  const inlineCodeLineSurface = resolveSlotSurface(config, tokens, 'inlineCodeLine', {
    color: codeTextColor,
    fontSize: 'sm',
    lineHeight: LINE_HEIGHT,
    flex: 1,
  })
  const resolvedHeaderColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : headerTextColor

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={inlineScrollSurface.style as ViewStyle | undefined}
      contentContainerStyle={inlineContentSurface.style as ViewStyle | undefined}
    >
      <View>
        {diff.map((line, index) => {
          const rowSurface = resolveSlotSurface(config, tokens, 'inlineLineRow', {
            flexDirection: 'row',
            alignItems: 'start',
            minHeight: LINE_HEIGHT,
            paddingX: 'xs',
            backgroundColor:
              highlightDiffs && line.type === 'added'
                ? DIFF_COLORS.addedBg
                : highlightDiffs && line.type === 'removed'
                  ? DIFF_COLORS.removedBg
                  : undefined,
          })
          const gutterSurface = resolveSlotSurface(config, tokens, 'inlineGutter', {
            flexDirection: 'row',
            width: 64,
            marginRight: 'sm',
            paddingX: 'xs',
            backgroundColor:
              highlightDiffs && line.type === 'added'
                ? DIFF_COLORS.addedGutter
                : highlightDiffs && line.type === 'removed'
                  ? DIFF_COLORS.removedGutter
                  : undefined,
          })
          const lineSurface = resolveSlotSurface(config, tokens, 'inlineCodeLine', {
            color:
              highlightDiffs && line.type === 'added'
                ? DIFF_COLORS.addedText
                : highlightDiffs && line.type === 'removed'
                  ? DIFF_COLORS.removedText
                  : resolvedHeaderColor === headerTextColor
                    ? codeTextColor
                    : resolvedHeaderColor,
            fontSize: 'sm',
            lineHeight: LINE_HEIGHT,
            flex: 1,
          })
          const prefix =
            line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '

          return (
            <View
              key={`${line.type}-${index}-${line.leftLineNum ?? 'x'}-${line.rightLineNum ?? 'x'}`}
              style={rowSurface.style as ViewStyle | undefined}
            >
              {showLineNumbers ? (
                <View style={gutterSurface.style as ViewStyle | undefined}>
                  <Text style={mergeTextStyle(sharedTextStyle, inlineLineNumberSurface)}>
                    {line.leftLineNum != null ? String(line.leftLineNum) : ''}
                  </Text>
                  <Text style={mergeTextStyle(sharedTextStyle, inlineLineNumberSurface)}>
                    {line.rightLineNum != null ? String(line.rightLineNum) : ''}
                  </Text>
                </View>
              ) : null}
              <Text
                style={{
                  ...mergeTextStyle(sharedTextStyle, inlineCodeLineSurface),
                  ...(lineSurface.style as TextStyle | undefined),
                  fontFamily: 'monospace',
                }}
                selectable
              >
                {`${prefix} ${line.content}`}
              </Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

function SideBySideView({
  config,
  diff,
  showLineNumbers,
  highlightDiffs,
  leftLabel,
  rightLabel,
  sharedTextStyle,
  codeTextColor,
  headerTextColor,
}: {
  config: CompareViewConfig
  diff: DiffLine[]
  showLineNumbers: boolean
  highlightDiffs: boolean
  leftLabel: string
  rightLabel: string
  sharedTextStyle: TextStyle
  codeTextColor: string
  headerTextColor: string
}) {
  const tokens = useTokens()
  const leftScrollRef = useRef<ScrollView>(null)
  const rightScrollRef = useRef<ScrollView>(null)
  const activeScroller = useRef<'left' | 'right' | null>(null)

  const panelData = useMemo(() => {
    const leftLines: PanelLine[] = []
    const rightLines: PanelLine[] = []

    for (const line of diff) {
      if (line.type === 'unchanged') {
        leftLines.push({
          lineNum: line.leftLineNum,
          content: line.content,
          type: 'unchanged',
        })
        rightLines.push({
          lineNum: line.rightLineNum,
          content: line.content,
          type: 'unchanged',
        })
        continue
      }

      if (line.type === 'removed') {
        leftLines.push({
          lineNum: line.leftLineNum,
          content: line.content,
          type: 'removed',
        })
        rightLines.push({
          lineNum: null,
          content: '',
          type: 'unchanged',
        })
        continue
      }

      leftLines.push({
        lineNum: null,
        content: '',
        type: 'unchanged',
      })
      rightLines.push({
        lineNum: line.rightLineNum,
        content: line.content,
        type: 'added',
      })
    }

    return { leftLines, rightLines }
  }, [diff])

  const panelsSurface = resolveSlotSurface(config, tokens, 'panels', {
    flexDirection: 'row',
    maxHeight: 400,
  })
  const panelSurface = resolveSlotSurface(config, tokens, 'panel', {
    flex: 1,
  })
  const panelHeaderSurface = resolveSlotSurface(config, tokens, 'panelHeader', {
    bg: HEADER_BG,
    paddingX: 'md',
    paddingY: 'sm',
  })
  const panelLabelSurface = resolveSlotSurface(config, tokens, 'panelLabel', {
    color: headerTextColor,
    fontSize: 'xs',
    fontWeight: 'medium',
  })
  const dividerSurface = resolveSlotSurface(config, tokens, 'divider', {
    width: 1,
    backgroundColor: DIVIDER_COLOR,
  })
  const panelScrollSurface = resolveSlotSurface(config, tokens, 'panelScroll', {
    flex: 1,
  })
  const panelContentSurface = resolveSlotSurface(config, tokens, 'panelContent')
  const panelLineNumberSurface = resolveSlotSurface(config, tokens, 'panelLineNumber', {
    color: LINE_NUMBER_COLOR,
    fontSize: 'xs',
    lineHeight: LINE_HEIGHT,
    width: 28,
    textAlign: 'right',
    marginRight: 'sm',
  })
  const panelCodeLineSurface = resolveSlotSurface(config, tokens, 'panelCodeLine', {
    color: codeTextColor,
    fontSize: 'sm',
    lineHeight: LINE_HEIGHT,
    flex: 1,
  })

  const syncScroll = useCallback(
    (
      source: 'left' | 'right',
      event: NativeSyntheticEvent<NativeScrollEvent>,
      target: React.RefObject<ScrollView | null>,
    ) => {
      if (activeScroller.current != null && activeScroller.current !== source) {
        return
      }

      activeScroller.current = source
      target.current?.scrollTo({
        y: event.nativeEvent.contentOffset.y,
        animated: false,
      })
      requestAnimationFrame(() => {
        activeScroller.current = null
      })
    },
    [],
  )

  const renderPanel = (
    lines: PanelLine[],
    label: string,
    scrollRef: React.RefObject<ScrollView | null>,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
  ) => (
    <View style={panelSurface.style as ViewStyle | undefined}>
      <View style={panelHeaderSurface.style as ViewStyle | undefined}>
        <Text style={mergeTextStyle(sharedTextStyle, panelLabelSurface)} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={panelScrollSurface.style as ViewStyle | undefined}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={panelContentSurface.style as ViewStyle | undefined}
        >
          <View>
            {lines.map((line, index) => {
              const rowSurface = resolveSlotSurface(config, tokens, 'panelLineRow', {
                flexDirection: 'row',
                alignItems: 'start',
                minHeight: LINE_HEIGHT,
                paddingX: 'sm',
                backgroundColor:
                  highlightDiffs && line.type === 'added'
                    ? DIFF_COLORS.addedBg
                    : highlightDiffs && line.type === 'removed'
                      ? DIFF_COLORS.removedBg
                      : undefined,
              })
              const codeLineSurface = resolveSlotSurface(config, tokens, 'panelCodeLine', {
                color:
                  highlightDiffs && line.type === 'added'
                    ? DIFF_COLORS.addedText
                    : highlightDiffs && line.type === 'removed'
                      ? DIFF_COLORS.removedText
                      : codeTextColor,
                fontSize: 'sm',
                lineHeight: LINE_HEIGHT,
                flex: 1,
              })

              return (
                <View
                  key={`${label}-${line.type}-${index}-${line.lineNum ?? 'x'}`}
                  style={rowSurface.style as ViewStyle | undefined}
                >
                  {showLineNumbers ? (
                    <Text
                      style={{
                        ...mergeTextStyle(sharedTextStyle, panelLineNumberSurface),
                        fontFamily: 'monospace',
                      }}
                    >
                      {line.lineNum != null ? String(line.lineNum).padStart(3, ' ') : '   '}
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      ...mergeTextStyle(sharedTextStyle, panelCodeLineSurface),
                      ...(codeLineSurface.style as TextStyle | undefined),
                      fontFamily: 'monospace',
                    }}
                    selectable
                  >
                    {line.content}
                  </Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  )

  return (
    <View style={panelsSurface.style as ViewStyle | undefined}>
      {renderPanel(panelData.leftLines, leftLabel, leftScrollRef, (event) =>
        syncScroll('left', event, rightScrollRef),
      )}
      <View style={dividerSurface.style as ViewStyle | undefined} />
      {renderPanel(panelData.rightLines, rightLabel, rightScrollRef, (event) =>
        syncScroll('right', event, leftScrollRef),
      )}
    </View>
  )
}

export function CompareView({ config }: { config: CompareViewConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const resolvedContainerStyle = resolveNativeStyleProps(
    config as Record<string, unknown>,
    tokens,
  )
  const leftContent = String(resolveFromRef(config.left.content, values) ?? '')
  const rightContent = String(resolveFromRef(config.right.content, values) ?? '')
  const mode = config.mode ?? 'side-by-side'
  const showLineNumbers = config.showLineNumbers ?? true
  const highlightDiffs = config.highlightDiffs ?? true

  const containerBg =
    typeof resolvedContainerStyle.backgroundColor === 'string'
      ? resolvedContainerStyle.backgroundColor
      : CODE_BG
  const containerRadius =
    typeof resolvedContainerStyle.borderRadius === 'number'
      ? resolvedContainerStyle.borderRadius
      : tokens.radius.lg
  const headerBg = containerBg === CODE_BG ? HEADER_BG : containerBg
  const codeTextColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : CODE_TEXT
  const headerTextColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : HEADER_TEXT_COLOR

  const diff = useMemo(
    () => computeDiff(leftContent.split('\n'), rightContent.split('\n')),
    [leftContent, rightContent],
  )
  const testId = config.testID ?? config.id ?? 'compare-view'

  const containerSurface = resolveSlotSurface(config, tokens, 'container', {
    bg: containerBg,
    borderRadius: containerRadius,
    overflow: 'hidden',
  })
  const headerSurface = resolveSlotSurface(config, tokens, 'header', {
    bg: headerBg,
    paddingX: 'lg',
    paddingY: 'sm',
  })
  const headerTextSurface = resolveSlotSurface(config, tokens, 'headerText', {
    color: headerTextColor,
    fontSize: 'xs',
    fontWeight: 'medium',
  })

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={containerSurface.style as ViewStyle | undefined}
        testID={testId}
        accessibilityRole="text"
        accessibilityLabel={`Comparison between ${config.left.label} and ${config.right.label}`}
      >
        {mode === 'inline' ? (
          <>
            <View style={headerSurface.style as ViewStyle | undefined}>
              <Text style={mergeTextStyle(sharedTextStyle, headerTextSurface)}>
                {`${config.left.label} -> ${config.right.label}`}
              </Text>
            </View>
            <InlineView
              config={config}
              diff={diff}
              showLineNumbers={showLineNumbers}
              highlightDiffs={highlightDiffs}
              sharedTextStyle={sharedTextStyle}
              codeTextColor={codeTextColor}
              headerTextColor={headerTextColor}
            />
          </>
        ) : (
          <SideBySideView
            config={config}
            diff={diff}
            showLineNumbers={showLineNumbers}
            highlightDiffs={highlightDiffs}
            leftLabel={config.left.label}
            rightLabel={config.right.label}
            sharedTextStyle={sharedTextStyle}
            codeTextColor={codeTextColor}
            headerTextColor={headerTextColor}
          />
        )}
      </View>
    </ComponentWrapper>
  )
}
