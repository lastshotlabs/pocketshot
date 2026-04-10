import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { CodeBlockConfig } from './types'

// ── Clipboard duck-type ────────────────────────────────────────────────────────

function trySetClipboard(text: string): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Clipboard = require('@react-native-clipboard/clipboard') as {
      default: { setString: (s: string) => void }
    }
    Clipboard.default.setString(text)
    return
  } catch {
    // try built-in RN Clipboard
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Clipboard } = require('react-native') as {
      Clipboard: { setString: (s: string) => void }
    }
    Clipboard.setString(text)
  } catch {
    // no clipboard available
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

// Intentionally dark regardless of theme — code editors always use a dark surface
const CODE_BG = '#1a1a2e'
const HEADER_BG = '#2d2d44'
const CODE_TEXT = '#e8e8e8'
const LINE_NUMBER_COLOR = '#666666'
const LANG_LABEL_COLOR = '#aaaacc'
const LINE_HEIGHT = 20

export function CodeBlock({ config }: { config: CodeBlockConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const code = resolveFromRef(config.code, values) as string
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const copyAnim = useRef(new Animated.Value(1)).current

  const allLines = useMemo(() => (code ?? '').split('\n'), [code])
  const displayLines = useMemo(() => {
    if (config.maxLines != null && !expanded) {
      return allLines.slice(0, config.maxLines)
    }
    return allLines
  }, [allLines, config.maxLines, expanded])

  const truncated = config.maxLines != null && !expanded && allLines.length > config.maxLines
  const hiddenCount = truncated ? allLines.length - (config.maxLines ?? 0) : 0

  const handleCopy = useCallback(() => {
    trySetClipboard(code ?? '')

    if (config.onCopy) {
      void dispatch(config.onCopy)
    }

    setCopied(true)
    Animated.sequence([
      Animated.timing(copyAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.timing(copyAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [code, config.onCopy, copyAnim, dispatch])

  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const showHeader = config.language != null || config.showCopyButton

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container} testID={config.testID ?? config.id}>
        {showHeader && (
          <View style={styles.header}>
            {config.language != null && (
              <Text style={styles.langLabel} accessibilityRole="text">
                {config.language}
              </Text>
            )}
            {config.showCopyButton && (
              <Animated.View style={{ opacity: copyAnim }}>
                <TouchableOpacity
                  onPress={handleCopy}
                  style={styles.copyButton}
                  accessibilityRole="button"
                  accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy code'}
                  testID={`${config.testID ?? config.id ?? 'code-block'}-copy`}
                  activeOpacity={0.7}
                >
                  <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy'}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          <View>
            {displayLines.map((line, idx) => (
              <View key={idx} style={styles.lineRow}>
                {config.showLineNumbers && (
                  <Text style={styles.lineNumber} selectable={false}>
                    {String(idx + 1).padStart(String(allLines.length).length, ' ')}
                  </Text>
                )}
                <Text style={styles.codeLine} selectable>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {truncated && (
          <TouchableOpacity
            onPress={() => setExpanded(true)}
            style={styles.showMoreButton}
            accessibilityRole="button"
            accessibilityLabel={`Show ${hiddenCount} more lines`}
            testID={`${config.testID ?? config.id ?? 'code-block'}-show-more`}
            activeOpacity={0.7}
          >
            <Text style={styles.showMoreText}>Show {hiddenCount} more lines</Text>
          </TouchableOpacity>
        )}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: CODE_BG,
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
    },
    header: {
      backgroundColor: HEADER_BG,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[2],
    },
    langLabel: {
      color: LANG_LABEL_COLOR,
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    copyButton: {
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[1],
    },
    copyText: {
      color: LANG_LABEL_COLOR,
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    scrollArea: {
      maxHeight: 400,
    },
    scrollContent: {
      padding: tokens.spacing[4],
    },
    lineRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: LINE_HEIGHT,
    },
    lineNumber: {
      color: LINE_NUMBER_COLOR,
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeSm,
      lineHeight: LINE_HEIGHT,
      width: 32,
      textAlign: 'right',
      marginRight: tokens.spacing[3],
    },
    codeLine: {
      color: CODE_TEXT,
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeSm,
      lineHeight: LINE_HEIGHT,
    },
    showMoreButton: {
      backgroundColor: HEADER_BG,
      paddingVertical: tokens.spacing[2],
      alignItems: 'center',
    },
    showMoreText: {
      color: LANG_LABEL_COLOR,
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}
