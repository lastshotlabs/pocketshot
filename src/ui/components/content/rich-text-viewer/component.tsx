import React, { useMemo, useState } from 'react'
import { Linking, Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { RichTextNode, RichTextViewerConfig } from './types'

const SELF_CLOSING = new Set(['br', 'hr', 'img'])

interface ParseState {
  pos: number
  src: string
}

function parseNodes(state: ParseState): RichTextNode[] {
  const nodes: RichTextNode[] = []

  while (state.pos < state.src.length) {
    const rest = state.src.slice(state.pos)

    if (rest.startsWith('</')) {
      break
    }

    const tagMatch = /^<(\w+)(\s[^>]*)?>/.exec(rest)
    if (tagMatch) {
      const tagName = tagMatch[1]!.toLowerCase()
      const attrStr = tagMatch[2] ?? ''
      state.pos += tagMatch[0].length

      if (SELF_CLOSING.has(tagName)) {
        if (tagName === 'br') {
          nodes.push({ type: 'text', content: '\n' })
        }
        continue
      }

      const children = parseNodes(state)
      const closeMatch = new RegExp(`^</${tagName}\\s*>`).exec(state.src.slice(state.pos))
      if (closeMatch) {
        state.pos += closeMatch[0].length
      }

      const mappedNode = mapTagToNode(tagName, attrStr, children)
      if (mappedNode != null) {
        nodes.push(mappedNode)
      }
      continue
    }

    const nextTagIndex = rest.indexOf('<')
    const text = nextTagIndex === -1 ? rest : rest.slice(0, nextTagIndex)
    if (text.length > 0) {
      nodes.push({ type: 'text', content: text })
      state.pos += text.length
    } else if (nextTagIndex === -1) {
      break
    }
  }

  return nodes
}

function mapTagToNode(tag: string, attrStr: string, children: RichTextNode[]): RichTextNode | null {
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
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return { type: 'heading', level: Number(tag[1]), children }
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
      return children.length === 1 ? children[0]! : { type: 'paragraph', children }
  }
}

function parseRichText(html: string): RichTextNode[] {
  const trimmed = html.trim()
  if (trimmed.length === 0) {
    return []
  }
  return parseNodes({ pos: 0, src: trimmed })
}

function resolveSlotSurface(
  config: RichTextViewerConfig,
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

function renderNodes(params: {
  nodes: RichTextNode[]
  config: RichTextViewerConfig
  tokens: DesignTokens
  sharedTextStyle: TextStyle
  keyPrefix: string
}): React.ReactNode[] {
  return params.nodes.map((node, index) =>
    renderNode({
      ...params,
      node,
      keyValue: `${params.keyPrefix}-${index}`,
    }),
  )
}

function renderNode(params: {
  node: RichTextNode
  config: RichTextViewerConfig
  tokens: DesignTokens
  sharedTextStyle: TextStyle
  keyValue: string
}): React.ReactNode {
  const { node, config, tokens, sharedTextStyle, keyValue } = params
  const textSurface = resolveSlotSurface(config, tokens, 'text', {
    color: 'foreground',
    fontSize: 'base',
    lineHeight: 'normal',
  })

  switch (node.type) {
    case 'text':
      return (
        <Text key={keyValue} style={mergeTextStyle(sharedTextStyle, textSurface)}>
          {node.content}
        </Text>
      )

    case 'bold':
      return (
        <Text
          key={keyValue}
          style={{
            ...mergeTextStyle(sharedTextStyle, textSurface),
            fontWeight: tokens.typography.fontWeightBold,
          }}
        >
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )

    case 'italic':
      return (
        <Text
          key={keyValue}
          style={{
            ...mergeTextStyle(sharedTextStyle, textSurface),
            fontStyle: 'italic',
          }}
        >
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )

    case 'underline':
      return (
        <Text
          key={keyValue}
          style={{
            ...mergeTextStyle(sharedTextStyle, textSurface),
            textDecorationLine: 'underline',
          }}
        >
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )

    case 'link': {
      const linkSurface = resolveSlotSurface(config, tokens, 'link', {
        color: 'primary',
        textDecorationLine: 'underline',
      })

      return (
        <Text
          key={keyValue}
          style={mergeTextStyle(sharedTextStyle, linkSurface)}
          accessibilityRole="link"
          accessibilityHint={node.href ? `Opens ${node.href}` : undefined}
          onPress={() => {
            if (node.href) {
              void Linking.openURL(node.href)
            }
          }}
        >
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )
    }

    case 'code': {
      const codeSurface = resolveSlotSurface(config, tokens, 'code', {
        color: 'primary',
        backgroundColor: tokens.colors.surfaceAlt,
        borderRadius: 'sm',
        paddingX: 4,
        paddingY: 1,
        fontSize: 'sm',
      })

      return (
        <Text
          key={keyValue}
          style={{
            ...mergeTextStyle(sharedTextStyle, codeSurface),
            fontFamily: 'monospace',
          }}
        >
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )
    }

    case 'heading': {
      const headingSurface = resolveSlotSurface(config, tokens, 'heading', {
        color: 'foreground',
        fontSize:
          node.level === 1
            ? 'xl'
            : node.level === 2
              ? 'lg'
              : node.level === 3
                ? 'base'
                : 'sm',
        fontWeight: node.level != null && node.level <= 2 ? 'bold' : 'semibold',
        marginY: 'sm',
      })

      return (
        <Text
          key={keyValue}
          style={mergeTextStyle(sharedTextStyle, headingSurface)}
          accessibilityRole="header"
        >
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )
    }

    case 'paragraph': {
      const paragraphSurface = resolveSlotSurface(config, tokens, 'paragraph', {
        color: 'foreground',
        fontSize: 'base',
        lineHeight: 'normal',
        marginBottom: 'sm',
      })

      return (
        <Text key={keyValue} style={mergeTextStyle(sharedTextStyle, paragraphSurface)}>
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )
    }

    case 'unordered-list':
    case 'ordered-list': {
      const listSurface = resolveSlotSurface(config, tokens, 'list', {
        marginBottom: 'sm',
        paddingLeft: 'md',
      })
      const bulletSurface = resolveSlotSurface(config, tokens, 'bullet', {
        color: 'muted',
        fontSize: 'base',
        marginRight: 'sm',
        minWidth: 16,
      })
      const listItemSurface = resolveSlotSurface(config, tokens, 'listItem', {
        flexDirection: 'row',
        marginBottom: 'xs',
      })

      return (
        <View key={keyValue} style={listSurface.style as ViewStyle | undefined}>
          {(node.children ?? []).map((child, index) => (
            <View
              key={`${keyValue}-item-${index}`}
              style={listItemSurface.style as ViewStyle | undefined}
            >
              <Text style={mergeTextStyle(sharedTextStyle, bulletSurface)}>
                {node.type === 'ordered-list' ? `${index + 1}.` : '-'}
              </Text>
              <View style={{ flex: 1 }}>
                {child.children
                  ? renderNodes({
                      nodes: child.children,
                      config,
                      tokens,
                      sharedTextStyle,
                      keyPrefix: `${keyValue}-item-${index}`,
                    })
                  : renderNode({
                      node: child,
                      config,
                      tokens,
                      sharedTextStyle,
                      keyValue: `${keyValue}-item-${index}`,
                    })}
              </View>
            </View>
          ))}
        </View>
      )
    }

    case 'list-item':
      return (
        <Text key={keyValue} style={mergeTextStyle(sharedTextStyle, textSurface)}>
          {node.children
            ? renderNodes({
                nodes: node.children,
                config,
                tokens,
                sharedTextStyle,
                keyPrefix: keyValue,
              })
            : node.content}
        </Text>
      )

    case 'blockquote': {
      const blockquoteSurface = resolveSlotSurface(config, tokens, 'blockquote', {
        borderLeftWidth: 3,
        borderLeftColor: tokens.colors.primary,
        paddingLeft: 'md',
        marginBottom: 'sm',
      })

      return (
        <View key={keyValue} style={blockquoteSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...mergeTextStyle(sharedTextStyle, textSurface),
              fontStyle: 'italic',
            }}
          >
            {node.children
              ? renderNodes({
                  nodes: node.children,
                  config,
                  tokens,
                  sharedTextStyle,
                  keyPrefix: keyValue,
                })
              : node.content}
          </Text>
        </View>
      )
    }

    default:
      return null
  }
}

export function RichTextViewer({ config }: { config: RichTextViewerConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const content = String(resolveFromRef(config.content, values) ?? '')
  const [expanded, setExpanded] = useState(false)
  const testId = config.testID ?? config.id

  const containerSurface = resolveSlotSurface(config, tokens, 'container')
  const expandButtonSurface = resolveSlotSurface(config, tokens, 'expandButton', {
    paddingY: 'sm',
    alignItems: 'center',
  })
  const expandTextSurface = resolveSlotSurface(config, tokens, 'expandText', {
    color: 'primary',
    fontSize: 'sm',
    fontWeight: 'medium',
  })
  const nodes = useMemo(() => parseRichText(content), [content])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId} style={containerSurface.style as ViewStyle | undefined}>
        <View
          style={
            config.maxLines != null && !expanded
              ? {
                  maxHeight: (config.maxLines ?? 5) * 22,
                  overflow: 'hidden',
                }
              : undefined
          }
        >
          {renderNodes({
            nodes,
            config,
            tokens,
            sharedTextStyle,
            keyPrefix: 'rtv',
          })}
        </View>

        {config.maxLines != null && (config.showExpandButton ?? true) ? (
          <TouchableOpacity
            onPress={() => setExpanded((current) => !current)}
            style={expandButtonSurface.style as ViewStyle | undefined}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Show less content' : 'Show more content'}
            testID={`${testId}-${expanded ? 'collapse' : 'expand'}`}
            activeOpacity={0.7}
          >
            <Text style={mergeTextStyle(sharedTextStyle, expandTextSurface)}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
