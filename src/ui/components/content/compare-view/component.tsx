import React, { useCallback, useMemo, useRef } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { CompareViewConfig, DiffLine } from './types'

// ── Diff algorithm (simple line-by-line LCS) ───────────────────────────────────

function computeDiff(leftLines: string[], rightLines: string[]): DiffLine[] {
  const m = leftLines.length
  const n = rightLines.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[])
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = []
  let i = m
  let j = n
  const stack: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      stack.push({
        type: 'unchanged',
        leftLineNum: i,
        rightLineNum: j,
        content: leftLines[i - 1],
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: 'added',
        leftLineNum: null,
        rightLineNum: j,
        content: rightLines[j - 1],
      })
      j--
    } else {
      stack.push({
        type: 'removed',
        leftLineNum: i,
        rightLineNum: null,
        content: leftLines[i - 1],
      })
      i--
    }
  }

  // Reverse since we built it backwards
  for (let k = stack.length - 1; k >= 0; k--) {
    result.push(stack[k])
  }

  return result
}

// ── Diff colors ────────────────────────────────────────────────────────────────

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
const LINE_HEIGHT = 20

// ── Inline mode ────────────────────────────────────────────────────────────────

function InlineView({
  diff,
  showLineNumbers,
  highlightDiffs,
  tokens,
}: {
  diff: DiffLine[]
  showLineNumbers: boolean
  highlightDiffs: boolean
  tokens: DesignTokens
}) {
  const styles = useMemo(() => makeInlineStyles(tokens), [tokens])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
    >
      <View>
        {diff.map((line, idx) => {
          const bgColor =
            highlightDiffs && line.type === 'added'
              ? DIFF_COLORS.addedBg
              : highlightDiffs && line.type === 'removed'
                ? DIFF_COLORS.removedBg
                : undefined

          const gutterBg =
            highlightDiffs && line.type === 'added'
              ? DIFF_COLORS.addedGutter
              : highlightDiffs && line.type === 'removed'
                ? DIFF_COLORS.removedGutter
                : undefined

          const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '

          return (
            <View key={idx} style={[styles.lineRow, bgColor != null ? { backgroundColor: bgColor } : undefined]}>
              {showLineNumbers && (
                <View style={[styles.gutterCell, gutterBg != null ? { backgroundColor: gutterBg } : undefined]}>
                  <Text style={styles.lineNumber}>
                    {line.leftLineNum != null ? String(line.leftLineNum) : ''}
                  </Text>
                  <Text style={styles.lineNumber}>
                    {line.rightLineNum != null ? String(line.rightLineNum) : ''}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.codeLine,
                  highlightDiffs && line.type === 'added' && { color: DIFF_COLORS.addedText },
                  highlightDiffs && line.type === 'removed' && { color: DIFF_COLORS.removedText },
                ]}
                selectable
              >
                {prefix} {line.content}
              </Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

// ── Side-by-side mode ──────────────────────────────────────────────────────────

function SideBySideView({
  diff,
  showLineNumbers,
  highlightDiffs,
  leftLabel,
  rightLabel,
  tokens,
}: {
  diff: DiffLine[]
  showLineNumbers: boolean
  highlightDiffs: boolean
  leftLabel: string
  rightLabel: string
  tokens: DesignTokens
}) {
  const leftScrollRef = useRef<ScrollView>(null)
  const rightScrollRef = useRef<ScrollView>(null)
  const isScrollingRef = useRef<'left' | 'right' | null>(null)

  const styles = useMemo(() => makeSideBySideStyles(tokens), [tokens])

  // Build separate left/right line arrays from diff
  const { leftLines, rightLines } = useMemo(() => {
    const left: Array<{ lineNum: number | null; content: string; type: 'unchanged' | 'added' | 'removed' }> = []
    const right: Array<{ lineNum: number | null; content: string; type: 'unchanged' | 'added' | 'removed' }> = []

    for (const line of diff) {
      if (line.type === 'unchanged') {
        left.push({ lineNum: line.leftLineNum, content: line.content, type: 'unchanged' })
        right.push({ lineNum: line.rightLineNum, content: line.content, type: 'unchanged' })
      } else if (line.type === 'removed') {
        left.push({ lineNum: line.leftLineNum, content: line.content, type: 'removed' })
        right.push({ lineNum: null, content: '', type: 'unchanged' })
      } else {
        left.push({ lineNum: null, content: '', type: 'unchanged' })
        right.push({ lineNum: line.rightLineNum, content: line.content, type: 'added' })
      }
    }

    return { leftLines: left, rightLines: right }
  }, [diff])

  const handleLeftScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isScrollingRef.current === 'right') return
      isScrollingRef.current = 'left'
      rightScrollRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false })
      // Reset after frame
      requestAnimationFrame(() => {
        isScrollingRef.current = null
      })
    },
    [],
  )

  const handleRightScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isScrollingRef.current === 'left') return
      isScrollingRef.current = 'right'
      leftScrollRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false })
      requestAnimationFrame(() => {
        isScrollingRef.current = null
      })
    },
    [],
  )

  const renderPanel = (
    lines: typeof leftLines,
    label: string,
    scrollRef: React.RefObject<ScrollView>,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void,
    side: 'left' | 'right',
  ) => (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.panelScroll}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {lines.map((line, idx) => {
              const bgColor =
                highlightDiffs && line.type === 'added'
                  ? DIFF_COLORS.addedBg
                  : highlightDiffs && line.type === 'removed'
                    ? DIFF_COLORS.removedBg
                    : undefined

              return (
                <View
                  key={idx}
                  style={[styles.lineRow, bgColor != null ? { backgroundColor: bgColor } : undefined]}
                >
                  {showLineNumbers && (
                    <Text style={styles.lineNumber}>
                      {line.lineNum != null ? String(line.lineNum).padStart(3, ' ') : '   '}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.codeLine,
                      highlightDiffs && line.type === 'added' && { color: DIFF_COLORS.addedText },
                      highlightDiffs && line.type === 'removed' && { color: DIFF_COLORS.removedText },
                    ]}
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
    <View style={styles.container}>
      {renderPanel(leftLines, leftLabel, leftScrollRef as React.RefObject<ScrollView>, handleLeftScroll, 'left')}
      <View style={styles.divider} />
      {renderPanel(rightLines, rightLabel, rightScrollRef as React.RefObject<ScrollView>, handleRightScroll, 'right')}
    </View>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CompareView({ config }: { config: CompareViewConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const leftContent = resolveFromRef(config.left.content, values) as string
  const rightContent = resolveFromRef(config.right.content, values) as string
  const mode = config.mode ?? 'side-by-side'
  const showLineNumbers = config.showLineNumbers ?? true
  const highlightDiffs = config.highlightDiffs ?? true

  const leftLines = useMemo(() => (leftContent ?? '').split('\n'), [leftContent])
  const rightLines = useMemo(() => (rightContent ?? '').split('\n'), [rightContent])
  const diff = useMemo(() => computeDiff(leftLines, rightLines), [leftLines, rightLines])

  const testId = config.testID ?? config.id ?? 'compare-view'
  const styles = useMemo(() => makeContainerStyles(tokens), [tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={styles.container}
        testID={testId}
        accessibilityRole="text"
        accessibilityLabel={`Comparison between ${config.left.label} and ${config.right.label}`}
      >
        {mode === 'inline' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {config.left.label} → {config.right.label}
              </Text>
            </View>
            <InlineView
              diff={diff}
              showLineNumbers={showLineNumbers}
              highlightDiffs={highlightDiffs}
              tokens={tokens}
            />
          </>
        ) : (
          <SideBySideView
            diff={diff}
            showLineNumbers={showLineNumbers}
            highlightDiffs={highlightDiffs}
            leftLabel={config.left.label}
            rightLabel={config.right.label}
            tokens={tokens}
          />
        )}
      </View>
    </ComponentWrapper>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeContainerStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: CODE_BG,
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
    },
    header: {
      backgroundColor: HEADER_BG,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[2],
    },
    headerText: {
      color: '#aaaacc',
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}

function makeInlineStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    scrollArea: {
      maxHeight: 400,
    },
    scrollContent: {
      padding: tokens.spacing[2],
    },
    lineRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: LINE_HEIGHT,
      paddingHorizontal: tokens.spacing[1],
    },
    gutterCell: {
      flexDirection: 'row',
      width: 64,
      marginRight: tokens.spacing[2],
      paddingHorizontal: tokens.spacing[1],
    },
    lineNumber: {
      color: LINE_NUMBER_COLOR,
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeXs,
      lineHeight: LINE_HEIGHT,
      width: 28,
      textAlign: 'right',
    },
    codeLine: {
      color: CODE_TEXT,
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeSm,
      lineHeight: LINE_HEIGHT,
      flex: 1,
    },
  })
}

function makeSideBySideStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      maxHeight: 400,
    },
    panel: {
      flex: 1,
    },
    panelHeader: {
      backgroundColor: HEADER_BG,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
    },
    panelLabel: {
      color: '#aaaacc',
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    panelScroll: {
      flex: 1,
    },
    divider: {
      width: 1,
      backgroundColor: '#3d3d5c',
    },
    lineRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: LINE_HEIGHT,
      paddingHorizontal: tokens.spacing[2],
    },
    lineNumber: {
      color: LINE_NUMBER_COLOR,
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeXs,
      lineHeight: LINE_HEIGHT,
      width: 28,
      textAlign: 'right',
      marginRight: tokens.spacing[2],
    },
    codeLine: {
      color: CODE_TEXT,
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeSm,
      lineHeight: LINE_HEIGHT,
      flex: 1,
    },
  })
}

