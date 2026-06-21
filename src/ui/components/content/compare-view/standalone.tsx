import React, { useCallback, useMemo, useRef } from 'react'
import { ScrollView, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { DiffLine } from './types'

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

function resolveSlot(
  slots: Record<string, Record<string, unknown> | undefined> | undefined,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface: slots?.[slot],
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

interface InlineViewProps {
  slots: Record<string, Record<string, unknown>> | undefined
  diff: DiffLine[]
  showLineNumbers: boolean
  highlightDiffs: boolean
  sharedTextStyle: TextStyle
  codeTextColor: string
  headerTextColor: string
}

function InlineView({
  slots,
  diff,
  showLineNumbers,
  highlightDiffs,
  sharedTextStyle,
  codeTextColor,
  headerTextColor,
}: InlineViewProps) {
  const tokens = useTokens()

  const inlineScrollSurface = resolveSlot(slots, tokens, 'inlineScroll', {
    maxHeight: 400,
  })
  const inlineContentSurface = resolveSlot(slots, tokens, 'inlineContent', {
    padding: 'sm',
  })
  const inlineLineNumberSurface = resolveSlot(slots, tokens, 'inlineLineNumber', {
    color: LINE_NUMBER_COLOR,
    fontSize: 'xs',
    lineHeight: LINE_HEIGHT,
    width: 28,
    textAlign: 'right',
  })
  const inlineCodeLineSurface = resolveSlot(slots, tokens, 'inlineCodeLine', {
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
          const rowSurface = resolveSlot(slots, tokens, 'inlineLineRow', {
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
          const gutterSurface = resolveSlot(slots, tokens, 'inlineGutter', {
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
          const lineSurface = resolveSlot(slots, tokens, 'inlineCodeLine', {
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

interface SideBySideViewProps {
  slots: Record<string, Record<string, unknown>> | undefined
  diff: DiffLine[]
  showLineNumbers: boolean
  highlightDiffs: boolean
  leftLabel: string
  rightLabel: string
  sharedTextStyle: TextStyle
  codeTextColor: string
  headerTextColor: string
}

function SideBySideView({
  slots,
  diff,
  showLineNumbers,
  highlightDiffs,
  leftLabel,
  rightLabel,
  sharedTextStyle,
  codeTextColor,
  headerTextColor,
}: SideBySideViewProps) {
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

  const panelsSurface = resolveSlot(slots, tokens, 'panels', {
    flexDirection: 'row',
    maxHeight: 400,
  })
  const panelSurface = resolveSlot(slots, tokens, 'panel', {
    flex: 1,
  })
  const panelHeaderSurface = resolveSlot(slots, tokens, 'panelHeader', {
    bg: HEADER_BG,
    paddingX: 'md',
    paddingY: 'sm',
  })
  const panelLabelSurface = resolveSlot(slots, tokens, 'panelLabel', {
    color: headerTextColor,
    fontSize: 'xs',
    fontWeight: 'medium',
  })
  const dividerSurface = resolveSlot(slots, tokens, 'divider', {
    width: 1,
    backgroundColor: DIVIDER_COLOR,
  })
  const panelScrollSurface = resolveSlot(slots, tokens, 'panelScroll', {
    flex: 1,
  })
  const panelContentSurface = resolveSlot(slots, tokens, 'panelContent')
  const panelLineNumberSurface = resolveSlot(slots, tokens, 'panelLineNumber', {
    color: LINE_NUMBER_COLOR,
    fontSize: 'xs',
    lineHeight: LINE_HEIGHT,
    width: 28,
    textAlign: 'right',
    marginRight: 'sm',
  })
  const panelCodeLineSurface = resolveSlot(slots, tokens, 'panelCodeLine', {
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
              const rowSurface = resolveSlot(slots, tokens, 'panelLineRow', {
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
              const codeLineSurface = resolveSlot(slots, tokens, 'panelCodeLine', {
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

export interface CompareViewSide {
  label: string
  content: string
}

export interface CompareViewBaseProps {
  /** Left side (label + content). */
  left: CompareViewSide
  /** Right side (label + content). */
  right: CompareViewSide
  /** Layout mode. */
  mode?: 'side-by-side' | 'inline'
  /** Show line numbers. */
  showLineNumbers?: boolean
  /** Highlight added/removed lines. */
  highlightDiffs?: boolean
  /** Style applied to root container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone CompareView — plain React props, no manifest required.
 *
 * @example
 * <CompareViewBase
 *   left={{ label: 'Before', content: 'a\nb' }}
 *   right={{ label: 'After', content: 'a\nB' }}
 * />
 */
export function CompareViewBase({
  left,
  right,
  mode = 'side-by-side',
  showLineNumbers = true,
  highlightDiffs = true,
  style,
  slots,
  testID,
  id,
}: CompareViewBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const containerBg = CODE_BG
  const containerRadius = tokens.radius.lg
  const headerBg = HEADER_BG
  const codeTextColor = CODE_TEXT
  const headerTextColor = HEADER_TEXT_COLOR

  const diff = useMemo(
    () => computeDiff(left.content.split('\n'), right.content.split('\n')),
    [left.content, right.content],
  )
  const testId = testID ?? id ?? 'compare-view'

  const containerSurface = resolveSlot(slots, tokens, 'container', {
    bg: containerBg,
    borderRadius: containerRadius,
    overflow: 'hidden',
  })
  const headerSurface = resolveSlot(slots, tokens, 'header', {
    bg: headerBg,
    paddingX: 'lg',
    paddingY: 'sm',
  })
  const headerTextSurface = resolveSlot(slots, tokens, 'headerText', {
    color: headerTextColor,
    fontSize: 'xs',
    fontWeight: 'medium',
  })

  return (
    <View
      style={[containerSurface.style as ViewStyle | undefined, style]}
      testID={testId}
      accessibilityRole="text"
      accessibilityLabel={`Comparison between ${left.label} and ${right.label}`}
    >
      {mode === 'inline' ? (
        <>
          <View style={headerSurface.style as ViewStyle | undefined}>
            <Text style={mergeTextStyle(sharedTextStyle, headerTextSurface)}>
              {`${left.label} -> ${right.label}`}
            </Text>
          </View>
          <InlineView
            slots={slots}
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
          slots={slots}
          diff={diff}
          showLineNumbers={showLineNumbers}
          highlightDiffs={highlightDiffs}
          leftLabel={left.label}
          rightLabel={right.label}
          sharedTextStyle={sharedTextStyle}
          codeTextColor={codeTextColor}
          headerTextColor={headerTextColor}
        />
      )}
    </View>
  )
}
