import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

function trySetClipboard(text: string): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Clipboard = require('@react-native-clipboard/clipboard') as {
      default: { setString: (value: string) => void }
    }
    Clipboard.default.setString(text)
    return
  } catch {
    // fall through
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Clipboard } = require('react-native') as {
      Clipboard: { setString: (value: string) => void }
    }
    Clipboard.setString(text)
  } catch {
    // clipboard unavailable
  }
}

const CODE_BG = '#1a1a2e'
const HEADER_BG = '#2d2d44'
const CODE_TEXT = '#e8e8e8'
const LINE_NUMBER_COLOR = '#666666'
const LANG_LABEL_COLOR = '#aaaacc'
const LINE_HEIGHT = 20

export interface CodeBlockBaseProps {
  /** Code source text. */
  code: string
  /** Optional language label shown in the header. */
  language?: string
  /** Show 1-based line numbers. */
  showLineNumbers?: boolean
  /** Show the Copy button in the header. */
  showCopyButton?: boolean
  /** Truncate to N lines, with "Show more" affordance. */
  maxLines?: number
  /** Called after the user copies to clipboard. */
  onCopy?: () => void
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone CodeBlock — plain React props, no manifest required.
 *
 * @example
 * <CodeBlockBase code={"const x = 1"} language="ts" showLineNumbers showCopyButton />
 */
export function CodeBlockBase({
  code,
  language,
  showLineNumbers,
  showCopyButton,
  maxLines,
  onCopy,
  style,
  slots,
  testID,
  id,
}: CodeBlockBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const copyAnim = useRef(new Animated.Value(1)).current

  const allLines = useMemo(() => (code ?? '').split('\n'), [code])
  const displayLines = useMemo(() => {
    if (maxLines != null && !expanded) {
      return allLines.slice(0, maxLines)
    }
    return allLines
  }, [allLines, maxLines, expanded])

  const truncated = maxLines != null && !expanded && allLines.length > maxLines
  const hiddenCount = truncated ? allLines.length - (maxLines ?? 0) : 0

  const containerBg = CODE_BG
  const containerRadius = tokens.radius.lg
  const textColor = CODE_TEXT
  const labelColor = LANG_LABEL_COLOR
  const fontSize = tokens.typography.fontSizeSm
  const lineHeight = LINE_HEIGHT

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: containerBg,
      borderRadius: containerRadius,
      overflow: 'hidden',
    },
    componentSurface: slots?.container,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: HEADER_BG,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingX: 'lg',
      paddingY: 'sm',
    },
    componentSurface: slots?.header,
  })
  const langLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: labelColor,
      fontSize: Math.min(fontSize, tokens.typography.fontSizeSm),
      fontWeight: 'medium',
    },
    componentSurface: slots?.langLabel,
  })
  const copyButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'sm',
      paddingY: 'xs',
    },
    componentSurface: slots?.copyButton,
  })
  const copyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: labelColor,
      fontSize: Math.min(fontSize, tokens.typography.fontSizeSm),
      fontWeight: 'medium',
    },
    componentSurface: slots?.copyText,
  })
  const scrollAreaSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      maxHeight: 400,
    },
    componentSurface: slots?.scrollArea,
  })
  const scrollContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'lg',
    },
    componentSurface: slots?.scrollContent,
  })
  const lineRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'start',
      minHeight: LINE_HEIGHT,
    },
    componentSurface: slots?.lineRow,
  })
  const lineNumberSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: LINE_NUMBER_COLOR,
      fontSize,
      lineHeight,
      width: 32,
      textAlign: 'right',
      marginRight: 'md',
    },
    componentSurface: slots?.lineNumber,
  })
  const codeLineSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: textColor,
      fontSize,
      lineHeight,
    },
    componentSurface: slots?.codeLine,
  })
  const showMoreButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: HEADER_BG,
      paddingY: 'sm',
      alignItems: 'center',
    },
    componentSurface: slots?.showMoreButton,
  })
  const showMoreTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: labelColor,
      fontSize,
      fontWeight: 'medium',
    },
    componentSurface: slots?.showMoreText,
  })

  const handleCopy = useCallback(() => {
    trySetClipboard(code ?? '')
    onCopy?.()
    setCopied(true)
    Animated.sequence([
      Animated.timing(copyAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.timing(copyAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [code, copyAnim, onCopy])

  const showHeader = language != null || showCopyButton
  const testId = testID ?? id ?? 'code-block'

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]} testID={testId}>
      {showHeader ? (
        <View style={headerSurface.style as ViewStyle | undefined}>
          {language != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(langLabelSurface.style as TextStyle | undefined),
              }}
              accessibilityRole="text"
            >
              {language}
            </Text>
          ) : null}
          {showCopyButton ? (
            <Animated.View style={{ opacity: copyAnim }}>
              <TouchableOpacity
                onPress={handleCopy}
                style={copyButtonSurface.style as ViewStyle | undefined}
                accessibilityRole="button"
                accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy code'}
                testID={`${testId}-copy`}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(copyTextSurface.style as TextStyle | undefined),
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={scrollAreaSurface.style as ViewStyle | undefined}
        contentContainerStyle={scrollContentSurface.style as ViewStyle | undefined}
      >
        <View>
          {displayLines.map((line, index) => (
            <View key={index} style={lineRowSurface.style as ViewStyle | undefined}>
              {showLineNumbers ? (
                <Text
                  style={{
                    ...sharedTextStyle,
                    fontFamily: 'monospace',
                    ...(lineNumberSurface.style as TextStyle | undefined),
                  }}
                  selectable={false}
                >
                  {String(index + 1).padStart(String(allLines.length).length, ' ')}
                </Text>
              ) : null}
              <Text
                style={{
                  ...sharedTextStyle,
                  fontFamily: 'monospace',
                  ...(codeLineSurface.style as TextStyle | undefined),
                }}
                selectable
              >
                {line}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {truncated ? (
        <TouchableOpacity
          onPress={() => setExpanded(true)}
          style={showMoreButtonSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityLabel={`Show ${hiddenCount} more lines`}
          testID={`${testId}-show-more`}
          activeOpacity={0.7}
        >
          <Text
            style={{
              ...sharedTextStyle,
              ...(showMoreTextSurface.style as TextStyle | undefined),
            }}
          >
            {`Show ${hiddenCount} more lines`}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}
