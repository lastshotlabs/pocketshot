import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { RichTextViewerConfig, RichTextNode } from './types'

// ── HTML-like parser ──────────────────────────────────────────────────────────

const SELF_CLOSING = new Set(['br', 'hr', 'img'])

interface ParseState {
  pos: number
  src: string
}

function parseNodes(state: ParseState): RichTextNode[] {
  const nodes: RichTextNode[] = []

  while (state.pos < state.src.length) {
    const rest = state.src.slice(state.pos)

    // Closing tag ahead — return to parent
    if (rest.startsWith('</')) break

    // Opening tag
    const tagMatch = /^<(\w+)(\s[^>]*)?>/.exec(rest)
    if (tagMatch) {
      const tagName = tagMatch[1].toLowerCase()
      const attrStr = tagMatch[2] ?? ''
      state.pos += tagMatch[0].length

      if (SELF_CLOSING.has(tagName)) {
        if (tagName === 'br') {
          nodes.push({ type: 'text', content: '\n' })
        } else if (tagName === 'hr') {
          nodes.push({ type: 'text', content: '' })
        }
        continue
      }

      const children = parseNodes(state)

      // Consume closing tag
      const closeMatch = new RegExp(`^</${tagName}\\s*>`).exec(state.src.slice(state.pos))
      if (closeMatch) {
        state.pos += closeMatch[0].length
      }

      const node = mapTagToNode(tagName, attrStr, children)
      if (node) nodes.push(node)
      continue
    }

    // Text content — consume until next tag
    const nextTag = rest.indexOf('<')
    const text = nextTag === -1 ? rest : rest.slice(0, nextTag)
    if (text.length > 0) {
      nodes.push({ type: 'text', content: text })
      state.pos += text.length
    } else if (nextTag === -1) {
      break
    }
  }

  return nodes
}

function mapTagToNode(
  tag: string,
  attrStr: string,
  children: RichTextNode[],
): RichTextNode | null {
  switch (tag) {
    case 'b':
    case 'strong':
      return { type: 'bold', children }
    case 'i':
    case 'em':
      return { type: 'italic', children }
    case 'u':
      return { type: 'underline', children }
    case 'a': {
      const hrefMatch = /href=["']([^"']*)["']/.exec(attrStr)
      return { type: 'link', href: hrefMatch?.[1], children }
    }
    case 'h1':
      return { type: 'heading', level: 1, children }
    case 'h2':
      return { type: 'heading', level: 2, children }
    case 'h3':
      return { type: 'heading', level: 3, children }
    case 'h4':
      return { type: 'heading', level: 4, children }
    case 'h5':
      return { type: 'heading', level: 5, children }
    case 'h6':
      return { type: 'heading', level: 6, children }
    case 'p':
      return { type: 'paragraph', children }
    case 'ul':
      return { type: 'unordered-list', children }
    case 'ol':
      return { type: 'ordered-list', children }
    case 'li':
      return { type: 'list-item', children }
    case 'blockquote':
      return { type: 'blockquote', children }
    case 'code':
      return { type: 'code', children }
    default:
      // Unknown tag — render children inline
      return children.length === 1 ? children[0] : { type: 'paragraph', children }
  }
}

function parseRichText(html: string): RichTextNode[] {
  const trimmed = html.trim()
  if (trimmed.length === 0) return []
  const state: ParseState = { pos: 0, src: trimmed }
  return parseNodes(state)
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderNodes(
  nodes: RichTextNode[],
  tokens: DesignTokens,
  baseTextStyle: ResolvedRichTextStyle,
  key: string,
): React.ReactNode[] {
  return nodes.map((node, idx) => renderNode(node, tokens, baseTextStyle, `${key}-${idx}`))
}

function renderNode(
  node: RichTextNode,
  tokens: DesignTokens,
  baseTextStyle: ResolvedRichTextStyle,
  key: string,
): React.ReactNode {
  switch (node.type) {
    case 'text':
      return (
        <Text key={key} style={{ color: baseTextStyle.color }}>
          {node.content}
        </Text>
      )

    case 'bold':
      return (
        <Text
          key={key}
          style={{ fontWeight: tokens.typography.fontWeightBold, color: baseTextStyle.color }}
        >
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )

    case 'italic':
      return (
        <Text key={key} style={{ fontStyle: 'italic', color: baseTextStyle.color }}>
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )

    case 'underline':
      return (
        <Text key={key} style={{ textDecorationLine: 'underline', color: baseTextStyle.color }}>
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )

    case 'link':
      return (
        <Text
          key={key}
          style={{
            color: typeof baseTextStyle.color === 'string' ? baseTextStyle.color : tokens.colors.primary,
            textDecorationLine: 'underline',
          }}
          accessibilityRole="link"
          accessibilityHint={node.href ? `Opens ${node.href}` : undefined}
          onPress={() => {
            if (node.href) void Linking.openURL(node.href)
          }}
        >
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )

    case 'code':
      return (
        <Text
          key={key}
          style={{
            fontFamily: 'monospace',
            backgroundColor: tokens.colors.surfaceAlt,
            color: tokens.colors.primary,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: tokens.radius.sm,
            fontSize: Math.max(baseTextStyle.fontSize - 1, tokens.typography.fontSizeXs),
          }}
        >
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )

    case 'heading': {
      const level = node.level ?? 1
      const fontSize =
        level === 1
          ? tokens.typography.fontSizeXl
          : level === 2
            ? tokens.typography.fontSizeLg
            : level === 3
              ? tokens.typography.fontSizeMd
              : tokens.typography.fontSizeSm
      const fontWeight =
        level <= 2
          ? tokens.typography.fontWeightBold
          : tokens.typography.fontWeightSemibold
      return (
        <Text
          key={key}
          style={{
            fontSize: Math.max(fontSize, baseTextStyle.fontSize),
            fontWeight,
            color: baseTextStyle.color,
            textAlign: baseTextStyle.textAlign,
            marginBottom: tokens.spacing[2],
            marginTop: tokens.spacing[2],
          }}
          accessibilityRole="header"
        >
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )
    }

    case 'paragraph':
      return (
        <Text
          key={key}
          style={{
            fontSize: baseTextStyle.fontSize,
            color: baseTextStyle.color,
            textAlign: baseTextStyle.textAlign,
            lineHeight: baseTextStyle.lineHeight,
            letterSpacing: baseTextStyle.letterSpacing,
            marginBottom: tokens.spacing[2],
          }}
        >
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )

    case 'unordered-list':
    case 'ordered-list': {
      const isOrdered = node.type === 'ordered-list'
      return (
        <View key={key} style={{ marginBottom: tokens.spacing[2], paddingLeft: tokens.spacing[3] }}>
          {(node.children ?? []).map((child, idx) => (
            <View
              key={`${key}-li-${idx}`}
              style={{
                flexDirection: 'row',
                marginBottom: tokens.spacing[1],
              }}
            >
              <Text
                style={{
                  color: tokens.colors.textMuted,
                  marginRight: tokens.spacing[2],
                  minWidth: 16,
                  fontSize: tokens.typography.fontSizeMd,
                }}
              >
                {isOrdered ? `${idx + 1}.` : '\u2022'}
              </Text>
              <View style={{ flex: 1 }}>
                {child.type === 'list-item' && child.children ? (
                  <Text
                    style={{
                      fontSize: baseTextStyle.fontSize,
                      color: baseTextStyle.color,
                      textAlign: baseTextStyle.textAlign,
                      lineHeight: baseTextStyle.lineHeight,
                      letterSpacing: baseTextStyle.letterSpacing,
                    }}
                  >
                    {renderNodes(child.children, tokens, baseTextStyle, `${key}-li-${idx}`)}
                  </Text>
                ) : (
                  renderNode(child, tokens, baseTextStyle, `${key}-li-${idx}`)
                )}
              </View>
            </View>
          ))}
        </View>
      )
    }

    case 'list-item':
      return (
        <Text
          key={key}
          style={{
            fontSize: baseTextStyle.fontSize,
            color: baseTextStyle.color,
            textAlign: baseTextStyle.textAlign,
            lineHeight: baseTextStyle.lineHeight,
            letterSpacing: baseTextStyle.letterSpacing,
          }}
        >
          {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
        </Text>
      )

    case 'blockquote':
      return (
        <View
          key={key}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: tokens.colors.primary,
            paddingLeft: tokens.spacing[3],
            marginBottom: tokens.spacing[2],
          }}
        >
          <Text
            style={{
              color: baseTextStyle.color,
              fontStyle: 'italic',
              fontSize: baseTextStyle.fontSize,
              textAlign: baseTextStyle.textAlign,
              lineHeight: baseTextStyle.lineHeight,
              letterSpacing: baseTextStyle.letterSpacing,
            }}
          >
            {node.children ? renderNodes(node.children, tokens, baseTextStyle, key) : node.content}
          </Text>
        </View>
      )

    default:
      return null
  }
}

interface ResolvedRichTextStyle {
  color: string
  fontSize: number
  lineHeight: number
  letterSpacing?: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
}

// ── Main component ────────────────────────────────────────────────────────────

export function RichTextViewer({ config }: { config: RichTextViewerConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const content = resolveFromRef(config.content, values) as string
  const [expanded, setExpanded] = useState(false)

  const nodes = useMemo(() => parseRichText(content ?? ''), [content])
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const baseTextStyle = useMemo(() => resolveViewerTextStyle(tokens, config), [config, tokens])

  const showExpandButton = config.showExpandButton ?? true
  const isTruncated = config.maxLines != null && !expanded

  const handleExpand = useCallback(() => {
    setExpanded(true)
  }, [])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
  }, [])

  const testId = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        <View
          style={isTruncated ? { maxHeight: (config.maxLines ?? 5) * 22, overflow: 'hidden' } : undefined}
        >
          {renderNodes(nodes, tokens, baseTextStyle, 'rtv')}
        </View>

        {config.maxLines != null && showExpandButton && !expanded && (
          <TouchableOpacity
            onPress={handleExpand}
            style={styles.expandButton}
            accessibilityRole="button"
            accessibilityLabel="Show more content"
            testID={`${testId}-expand`}
            activeOpacity={0.7}
          >
            <Text style={styles.expandText}>Show more</Text>
          </TouchableOpacity>
        )}

        {config.maxLines != null && showExpandButton && expanded && (
          <TouchableOpacity
            onPress={handleCollapse}
            style={styles.expandButton}
            accessibilityRole="button"
            accessibilityLabel="Show less content"
            testID={`${testId}-collapse`}
            activeOpacity={0.7}
          >
            <Text style={styles.expandText}>Show less</Text>
          </TouchableOpacity>
        )}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    expandButton: {
      paddingVertical: tokens.spacing[2],
      alignItems: 'center',
    },
    expandText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}

function resolveViewerTextStyle(
  tokens: DesignTokens,
  config: RichTextViewerConfig,
): ResolvedRichTextStyle {
  const resolvedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  return {
    color:
      typeof resolvedTextStyle.color === 'string' ? resolvedTextStyle.color : tokens.colors.text,
    fontSize:
      typeof resolvedTextStyle.fontSize === 'number'
        ? resolvedTextStyle.fontSize
        : tokens.typography.fontSizeMd,
    lineHeight:
      typeof resolvedTextStyle.lineHeight === 'number'
        ? resolvedTextStyle.lineHeight
        : tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    letterSpacing:
      typeof resolvedTextStyle.letterSpacing === 'number'
        ? resolvedTextStyle.letterSpacing
        : undefined,
    textAlign:
      resolvedTextStyle.textAlign === 'center' ||
      resolvedTextStyle.textAlign === 'right' ||
      resolvedTextStyle.textAlign === 'justify'
        ? resolvedTextStyle.textAlign
        : 'left',
  }
}

