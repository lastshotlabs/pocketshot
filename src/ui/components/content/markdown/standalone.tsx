import React from 'react'
import { View, Text, ScrollView, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { MarkdownNode } from './types'

function parseInline(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = []
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
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

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', content: text }]
}

export function parseMarkdown(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = []
  const lines = text.split('\n')
  let index = 0

  while (index < lines.length) {
    const line = lines[index]!

    if (line.trim() === '```' || line.trim().startsWith('```')) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && lines[index]!.trim() !== '```') {
        codeLines.push(lines[index] ?? '')
        index += 1
      }
      nodes.push({ type: 'code_block', content: codeLines.join('\n') })
      index += 1
      continue
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      nodes.push({ type: 'hr', content: '' })
      index += 1
      continue
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line)
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        level: headingMatch[1]!.length,
        content: headingMatch[2]!,
        children: parseInline(headingMatch[2]!),
      })
      index += 1
      continue
    }

    if (line.startsWith('> ')) {
      nodes.push({
        type: 'blockquote',
        content: line.slice(2),
        children: parseInline(line.slice(2)),
      })
      index += 1
      continue
    }

    const unorderedMatch = /^(\s*)[-*]\s+(.+)$/.exec(line)
    if (unorderedMatch) {
      nodes.push({
        type: 'list_item',
        ordered: false,
        content: unorderedMatch[2]!,
        children: parseInline(unorderedMatch[2]!),
      })
      index += 1
      continue
    }

    const orderedMatch = /^(\s*)\d+\.\s+(.+)$/.exec(line)
    if (orderedMatch) {
      nodes.push({
        type: 'list_item',
        ordered: true,
        content: orderedMatch[2]!,
        children: parseInline(orderedMatch[2]!),
      })
      index += 1
      continue
    }

    if (line.trim() === '') {
      index += 1
      continue
    }

    nodes.push({
      type: 'paragraph',
      content: line,
      children: parseInline(line),
    })
    index += 1
  }

  return nodes
}

function renderInlineNodes(
  nodes: MarkdownNode[],
  baseTextStyle: TextStyle,
  baseFontSize: number,
  baseTextColor: string,
) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'bold':
        return (
          <Text key={index} style={{ fontWeight: '700', color: baseTextColor }}>
            {node.content}
          </Text>
        )
      case 'italic':
        return (
          <Text key={index} style={{ fontStyle: 'italic', color: baseTextColor }}>
            {node.content}
          </Text>
        )
      case 'code_inline':
        return (
          <Text
            key={index}
            style={{
              ...baseTextStyle,
              fontFamily: 'monospace',
              backgroundColor: '#f4f4f5',
              color: '#2563eb',
              fontSize: baseFontSize - 1,
              paddingHorizontal: 4,
              paddingVertical: 1,
              borderRadius: 4,
            }}
          >
            {node.content}
          </Text>
        )
      default:
        return (
          <Text key={index} style={{ color: baseTextColor }}>
            {node.content}
          </Text>
        )
    }
  })
}

interface MarkdownBlockContext {
  slots?: Record<string, Record<string, unknown>>
  baseTextStyle: TextStyle
  baseFontSize: number
  baseTextColor: string
  baseTextAlign: 'left' | 'center' | 'right' | 'justify'
  baseLineHeight: number
}

function MarkdownBlock({
  node,
  index,
  orderedCounter,
  ctx,
}: {
  node: MarkdownNode
  index: number
  orderedCounter?: number
  ctx: MarkdownBlockContext
}) {
  const tokens = useTokens()
  const { slots, baseTextStyle, baseFontSize, baseTextColor, baseTextAlign, baseLineHeight } = ctx

  switch (node.type) {
    case 'heading': {
      const level = node.level ?? 1
      const headingSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          fontSize: level === 1 ? 28 : level === 2 ? 24 : level === 3 ? 20 : 18,
          fontWeight: 'bold',
          color: baseTextColor,
          textAlign: baseTextAlign,
          marginBottom: 'sm',
        },
        componentSurface: slots?.heading,
      })
      return (
        <Text
          key={index}
          style={{
            ...baseTextStyle,
            ...(headingSurface.style as TextStyle | undefined),
          }}
          accessibilityRole="header"
        >
          {node.children
            ? renderInlineNodes(node.children, baseTextStyle, baseFontSize, baseTextColor)
            : node.content}
        </Text>
      )
    }

    case 'paragraph': {
      const paragraphSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          fontSize: baseFontSize,
          color: baseTextColor,
          textAlign: baseTextAlign,
          lineHeight: baseLineHeight,
          marginBottom: 'sm',
        },
        componentSurface: slots?.paragraph,
      })
      return (
        <Text
          key={index}
          style={{
            ...baseTextStyle,
            ...(paragraphSurface.style as TextStyle | undefined),
          }}
        >
          {node.children
            ? renderInlineNodes(node.children, baseTextStyle, baseFontSize, baseTextColor)
            : node.content}
        </Text>
      )
    }

    case 'code_block': {
      const codeBlockSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          bg: 'muted',
          borderRadius: 'md',
          padding: 'md',
          marginBottom: 'sm',
        },
        componentSurface: slots?.codeBlock,
      })
      return (
        <ScrollView key={index} horizontal showsHorizontalScrollIndicator={false}>
          <View style={codeBlockSurface.style as ViewStyle | undefined}>
            <Text
              style={{
                ...baseTextStyle,
                fontFamily: 'monospace',
                fontSize: 13,
                color: baseTextColor,
              }}
            >
              {node.content}
            </Text>
          </View>
        </ScrollView>
      )
    }

    case 'blockquote': {
      const blockquoteSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          borderLeftWidth: 3,
          borderLeftColor: '#d4d4d8',
          paddingLeft: 'md',
          marginBottom: 'sm',
        },
        componentSurface: slots?.blockquote,
      })
      return (
        <View key={index} style={blockquoteSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...baseTextStyle,
              color: baseTextColor,
              textAlign: baseTextAlign,
              fontStyle: 'italic',
            }}
          >
            {node.children
              ? renderInlineNodes(node.children, baseTextStyle, baseFontSize, baseTextColor)
              : node.content}
          </Text>
        </View>
      )
    }

    case 'list_item': {
      const listItemSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 'xs',
        },
        componentSurface: slots?.listItem,
      })
      const listBulletSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          width: 20,
          fontSize: baseFontSize,
          color: baseTextColor,
        },
        componentSurface: slots?.listBullet,
      })
      const listContentSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          flex: 1,
          fontSize: baseFontSize,
          color: baseTextColor,
          textAlign: baseTextAlign,
          lineHeight: baseLineHeight,
        },
        componentSurface: slots?.listContent,
      })
      const bullet = node.ordered ? `${orderedCounter ?? 1}.` : '-'
      return (
        <View key={index} style={listItemSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...baseTextStyle,
              ...(listBulletSurface.style as TextStyle | undefined),
            }}
          >
            {bullet}
          </Text>
          <Text
            style={{
              ...baseTextStyle,
              ...(listContentSurface.style as TextStyle | undefined),
            }}
          >
            {node.children
              ? renderInlineNodes(node.children, baseTextStyle, baseFontSize, baseTextColor)
              : node.content}
          </Text>
        </View>
      )
    }

    case 'hr': {
      const hrSurface = resolveSurfacePresentation({
        tokens,
        implementationBase: {
          height: 1,
          bg: 'border',
          marginY: 'md',
        },
        componentSurface: slots?.hr,
      })
      return <View key={index} style={hrSurface.style as ViewStyle | undefined} />
    }

    default:
      return null
  }
}

export interface MarkdownBaseProps {
  /** Markdown content. */
  content: string
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone Markdown — plain React props, no manifest required.
 *
 * @example
 * <MarkdownBase content={"# Title\n\nSome **bold** text."} />
 */
export function MarkdownBase({ content, style, slots, testID, id }: MarkdownBaseProps) {
  const tokens = useTokens()

  const baseTextStyle = resolveNativeTextStyle({}, tokens)
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

  const nodes = React.useMemo(() => parseMarkdown(content ?? ''), [content])
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {},
    componentSurface: slots?.container,
  })

  let orderedCounter = 0
  const ctx: MarkdownBlockContext = {
    slots,
    baseTextStyle,
    baseFontSize,
    baseTextColor,
    baseTextAlign,
    baseLineHeight,
  }

  return (
    <View
      style={[containerSurface.style as ViewStyle | undefined, style]}
      testID={testID ?? id}
    >
      {nodes.map((node, index) => {
        if (node.type === 'list_item' && node.ordered) {
          orderedCounter += 1
        } else {
          orderedCounter = 0
        }

        return (
          <MarkdownBlock
            key={index}
            node={node}
            index={index}
            orderedCounter={orderedCounter}
            ctx={ctx}
          />
        )
      })}
    </View>
  )
}
