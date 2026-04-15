import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { MarkdownConfig, MarkdownNode } from './types'

// ── Optional peer dep: react-native-markdown-display ──────────────────────────

let RNMarkdownDisplay: React.ComponentType<{ style?: object; children: string }> | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-markdown-display') as {
    default: React.ComponentType<{ style?: object; children: string }>
  }
  RNMarkdownDisplay = mod.default
} catch {
  // not installed — use custom parser
}

// ── Markdown parser ────────────────────────────────────────────────────────────

/**
 * Parse inline spans within a line of text.
 * Handles **bold**, *italic*, _italic_, and `code`.
 */
function parseInline(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = []
  // Combined regex: **bold**, *italic*, _italic_, `code`
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    if (match[2] != null) {
      nodes.push({ type: 'bold', content: match[2] })
    } else if (match[3] != null) {
      nodes.push({ type: 'italic', content: match[3] })
    } else if (match[4] != null) {
      nodes.push({ type: 'italic', content: match[4] })
    } else if (match[5] != null) {
      nodes.push({ type: 'code_inline', content: match[5] })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', content: text }]
}

export function parseMarkdown(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.trim() === '```' || line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '```') {
        codeLines.push(lines[i])
        i++
      }
      nodes.push({ type: 'code_block', content: codeLines.join('\n') })
      i++
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      nodes.push({ type: 'hr', content: '' })
      i++
      continue
    }

    // Heading
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line)
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
        children: parseInline(headingMatch[2]),
      })
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push({
        type: 'blockquote',
        content: line.slice(2),
        children: parseInline(line.slice(2)),
      })
      i++
      continue
    }

    // Unordered list item
    const ulMatch = /^(\s*)[-*]\s+(.+)$/.exec(line)
    if (ulMatch) {
      nodes.push({
        type: 'list_item',
        ordered: false,
        content: ulMatch[2],
        children: parseInline(ulMatch[2]),
      })
      i++
      continue
    }

    // Ordered list item
    const olMatch = /^(\s*)\d+\.\s+(.+)$/.exec(line)
    if (olMatch) {
      nodes.push({
        type: 'list_item',
        ordered: true,
        content: olMatch[2],
        children: parseInline(olMatch[2]),
      })
      i++
      continue
    }

    // Empty line — skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph with inline formatting
    nodes.push({
      type: 'paragraph',
      content: line,
      children: parseInline(line),
    })
    i++
  }

  return nodes
}

// ── Inline renderer ────────────────────────────────────────────────────────────

function renderInlineNodes(
  nodes: MarkdownNode[],
  tokens: DesignTokens,
  baseFontSize: number,
  baseTextColor: string,
): React.ReactNode[] {
  return nodes.map((node, idx) => {
    switch (node.type) {
      case 'bold':
        return (
          <Text key={idx} style={{ fontWeight: tokens.typography.fontWeightBold, color: baseTextColor }}>
            {node.content}
          </Text>
        )
      case 'italic':
        return (
          <Text key={idx} style={{ fontStyle: 'italic', color: baseTextColor }}>
            {node.content}
          </Text>
        )
      case 'code_inline':
        return (
          <Text
            key={idx}
            style={{
              fontFamily: 'monospace',
              backgroundColor: tokens.colors.surfaceAlt,
              color: tokens.colors.primary,
              fontSize: baseFontSize - 1,
              paddingHorizontal: 4,
              paddingVertical: 1,
              borderRadius: tokens.radius.sm,
            }}
          >
            {node.content}
          </Text>
        )
      default:
        return <Text key={idx} style={{ color: baseTextColor }}>{node.content}</Text>
    }
  })
}

// ── Block renderer ─────────────────────────────────────────────────────────────

interface BlockProps {
  node: MarkdownNode
  tokens: DesignTokens
  baseFontSize: number
  baseTextAlign: 'left' | 'center' | 'right' | 'justify'
  baseTextColor: string
  baseLineHeight: number
  index: number
  orderedCounter?: number
}

function MarkdownBlock({
  node,
  tokens,
  baseFontSize,
  baseTextAlign,
  baseTextColor,
  baseLineHeight,
  index,
  orderedCounter,
}: BlockProps) {
  const styles = useMemo(() => makeBlockStyles(tokens), [tokens])

  switch (node.type) {
    case 'heading': {
      const level = node.level ?? 1
      const headingStyle = [
        styles.heading,
        level === 1 && styles.h1,
        level === 2 && styles.h2,
        level === 3 && styles.h3,
        level >= 4 && styles.h4,
      ]
      return (
        <Text
          key={index}
          style={[headingStyle, { color: baseTextColor, textAlign: baseTextAlign }]}
          accessibilityRole="header"
        >
          {node.children
            ? renderInlineNodes(node.children, tokens, baseFontSize, baseTextColor)
            : node.content}
        </Text>
      )
    }

    case 'paragraph':
      return (
        <Text
          key={index}
          style={[
            styles.paragraph,
            {
              fontSize: baseFontSize,
              color: baseTextColor,
              textAlign: baseTextAlign,
              lineHeight: baseLineHeight,
            },
          ]}
        >
          {node.children
            ? renderInlineNodes(node.children, tokens, baseFontSize, baseTextColor)
            : node.content}
        </Text>
      )

    case 'code_block':
      return (
        <ScrollView key={index} horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.codeBlock}>
            <Text style={[styles.codeBlockText, { fontSize: tokens.typography.fontSizeSm }]}>
              {node.content}
            </Text>
          </View>
        </ScrollView>
      )

    case 'blockquote':
      return (
        <View key={index} style={styles.blockquote}>
          <Text style={[styles.blockquoteText, { textAlign: baseTextAlign }]}>
            {node.children
              ? renderInlineNodes(node.children, tokens, baseFontSize, baseTextColor)
              : node.content}
          </Text>
        </View>
      )

    case 'list_item': {
      const bullet = node.ordered ? `${orderedCounter ?? 1}.` : '•'
      return (
        <View key={index} style={styles.listItem}>
          <Text style={[styles.listBullet, { fontSize: baseFontSize }]}>{bullet}</Text>
          <Text
            style={[
              styles.listContent,
              {
                fontSize: baseFontSize,
                color: baseTextColor,
                textAlign: baseTextAlign,
                lineHeight: baseLineHeight,
              },
            ]}
          >
            {node.children
              ? renderInlineNodes(node.children, tokens, baseFontSize, baseTextColor)
              : node.content}
          </Text>
        </View>
      )
    }

    case 'hr':
      return <View key={index} style={styles.hr} />

    default:
      return null
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export function Markdown({ config }: { config: MarkdownConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const content = resolveFromRef(config.content, values) as string
  const baseTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const baseFontSize =
    typeof baseTextStyle.fontSize === 'number' ? baseTextStyle.fontSize : tokens.typography.fontSizeMd
  const baseTextColor =
    typeof baseTextStyle.color === 'string' ? baseTextStyle.color : tokens.colors.text
  const baseTextAlign =
    baseTextStyle.textAlign === 'center' ||
    baseTextStyle.textAlign === 'right' ||
    baseTextStyle.textAlign === 'justify'
      ? baseTextStyle.textAlign
      : 'left'
  const baseLineHeight =
    typeof baseTextStyle.lineHeight === 'number'
      ? baseTextStyle.lineHeight
      : baseFontSize * tokens.typography.lineHeightNormal

  // If react-native-markdown-display is available, delegate to it
  if (RNMarkdownDisplay != null) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <RNMarkdownDisplay
          style={{
            body: {
              fontSize: baseFontSize,
              color: baseTextColor,
              textAlign: baseTextAlign,
              lineHeight: baseLineHeight,
            },
            heading1: {
              fontSize: tokens.typography.fontSizeXl,
              fontWeight: tokens.typography.fontWeightBold,
              color: baseTextColor,
              textAlign: baseTextAlign,
            },
            heading2: {
              fontSize: tokens.typography.fontSizeLg,
              fontWeight: tokens.typography.fontWeightBold,
              color: baseTextColor,
              textAlign: baseTextAlign,
            },
            code_inline: {
              fontFamily: 'monospace',
              backgroundColor: tokens.colors.surfaceAlt,
              color: tokens.colors.primary,
            },
            fence: {
              backgroundColor: tokens.colors.surfaceAlt,
              borderRadius: tokens.radius.md,
              fontFamily: 'monospace',
            },
          }}
        >
          {content}
        </RNMarkdownDisplay>
      </ComponentWrapper>
    )
  }

  const nodes = useMemo(() => parseMarkdown(content ?? ''), [content])

  // Track ordered list counters
  let orderedCounter = 0

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={config.testID ?? config.id}>
        {nodes.map((node, idx) => {
          if (node.type === 'list_item' && node.ordered) {
            orderedCounter++
          } else {
            orderedCounter = 0
          }
          return (
            <MarkdownBlock
              key={idx}
              node={node}
              tokens={tokens}
              baseFontSize={baseFontSize}
              baseTextAlign={baseTextAlign}
              baseTextColor={baseTextColor}
              baseLineHeight={baseLineHeight}
              index={idx}
              orderedCounter={orderedCounter}
            />
          )
        })}
      </View>
    </ComponentWrapper>
  )
}

function makeBlockStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    heading: {
      color: tokens.colors.text,
    },
    h1: {
      fontSize: tokens.typography.fontSizeXl,
      fontWeight: tokens.typography.fontWeightBold,
      marginBottom: tokens.spacing[3],
    },
    h2: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightBold,
      marginBottom: tokens.spacing[2],
    },
    h3: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      marginBottom: tokens.spacing[2],
    },
    h4: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      marginBottom: tokens.spacing[1],
    },
    paragraph: {
      color: tokens.colors.text,
      marginBottom: tokens.spacing[2],
      lineHeight: tokens.typography.fontSizeMd * 1.5,
    },
    codeBlock: {
      backgroundColor: tokens.colors.surfaceAlt,
      padding: tokens.spacing[3],
      borderRadius: tokens.radius.md,
      marginBottom: tokens.spacing[2],
    },
    codeBlockText: {
      fontFamily: 'monospace',
      color: tokens.colors.text,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: tokens.colors.primary,
      paddingLeft: tokens.spacing[3],
      marginBottom: tokens.spacing[2],
    },
    blockquoteText: {
      color: tokens.colors.textMuted,
      fontStyle: 'italic',
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: tokens.spacing[1],
      paddingLeft: tokens.spacing[2],
    },
    listBullet: {
      color: tokens.colors.textMuted,
      marginRight: tokens.spacing[2],
      minWidth: 16,
    },
    listContent: {
      flex: 1,
      color: tokens.colors.text,
    },
    hr: {
      height: 1,
      backgroundColor: tokens.colors.border,
      marginVertical: tokens.spacing[4],
    },
  })
}

