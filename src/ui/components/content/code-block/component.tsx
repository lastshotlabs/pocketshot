import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Animated, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { CodeBlockConfig } from './types'

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

  const resolvedSurfaceStyle = resolveNativeStyleProps(
    {
      bg: config.bg,
      borderRadius: config.borderRadius,
    },
    tokens,
  )
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const containerBg =
    typeof resolvedSurfaceStyle.backgroundColor === 'string' ? resolvedSurfaceStyle.backgroundColor : CODE_BG
  const containerRadius =
    typeof resolvedSurfaceStyle.borderRadius === 'number' ? resolvedSurfaceStyle.borderRadius : tokens.radius.lg
  const textColor = typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : CODE_TEXT
  const labelColor = typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : LANG_LABEL_COLOR
  const fontSize =
    typeof sharedTextStyle.fontSize === 'number' ? sharedTextStyle.fontSize : tokens.typography.fontSizeSm
  const lineHeight = typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : LINE_HEIGHT
  const letterSpacing =
    typeof sharedTextStyle.letterSpacing === 'number' ? sharedTextStyle.letterSpacing : undefined

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: containerBg,
      borderRadius: containerRadius,
      overflow: 'hidden',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: containerBg === CODE_BG ? HEADER_BG : containerBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingX: 'lg',
      paddingY: 'sm',
    },
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const langLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: labelColor,
      fontSize: Math.min(fontSize, tokens.typography.fontSizeSm),
      fontWeight: 'medium',
    },
    componentSurface: config.slots?.langLabel as Record<string, unknown> | undefined,
  })
  const copyButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'sm',
      paddingY: 'xs',
    },
    componentSurface: config.slots?.copyButton as Record<string, unknown> | undefined,
  })
  const copyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: labelColor,
      fontSize: Math.min(fontSize, tokens.typography.fontSizeSm),
      fontWeight: 'medium',
    },
    componentSurface: config.slots?.copyText as Record<string, unknown> | undefined,
  })
  const scrollAreaSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      maxHeight: 400,
    },
    componentSurface: config.slots?.scrollArea as Record<string, unknown> | undefined,
  })
  const scrollContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'lg',
    },
    componentSurface: config.slots?.scrollContent as Record<string, unknown> | undefined,
  })
  const lineRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'start',
      minHeight: LINE_HEIGHT,
    },
    componentSurface: config.slots?.lineRow as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.lineNumber as Record<string, unknown> | undefined,
  })
  const codeLineSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: textColor,
      fontSize,
      lineHeight,
      letterSpacing,
    },
    componentSurface: config.slots?.codeLine as Record<string, unknown> | undefined,
  })
  const showMoreButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: containerBg === CODE_BG ? HEADER_BG : containerBg,
      paddingY: 'sm',
      alignItems: 'center',
    },
    componentSurface: config.slots?.showMoreButton as Record<string, unknown> | undefined,
  })
  const showMoreTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: labelColor,
      fontSize,
      fontWeight: 'medium',
    },
    componentSurface: config.slots?.showMoreText as Record<string, unknown> | undefined,
  })

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

  const showHeader = config.language != null || config.showCopyButton
  const testId = config.testID ?? config.id ?? 'code-block'

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={containerSurface.style as ViewStyle | undefined} testID={testId}>
        {showHeader ? (
          <View style={headerSurface.style as ViewStyle | undefined}>
            {config.language != null ? (
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(langLabelSurface.style as TextStyle | undefined),
                }}
                accessibilityRole="text"
              >
                {config.language}
              </Text>
            ) : null}
            {config.showCopyButton ? (
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
                {config.showLineNumbers ? (
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
    </ComponentWrapper>
  )
}
