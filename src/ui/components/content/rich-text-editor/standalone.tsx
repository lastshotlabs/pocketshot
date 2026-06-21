import React, { useCallback, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type DimensionValue,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { EditorToolbarItem } from './types'

const LINE_HEIGHT = 22

const TOOLBAR_LABELS: Record<EditorToolbarItem, string> = {
  heading: 'H',
  bold: 'B',
  italic: 'I',
  underline: 'U',
  'list-bullet': '-',
  'list-number': '1.',
  blockquote: '"',
  code: '</>',
  link: 'Link',
  image: 'Img',
}

const INLINE_ITEMS = new Set<EditorToolbarItem>(['bold', 'italic', 'underline'])
const BLOCK_ITEMS = new Set<EditorToolbarItem>(['list-bullet', 'list-number', 'blockquote'])

const TOOLBAR_A11Y: Record<EditorToolbarItem, string> = {
  heading: 'Heading',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  'list-bullet': 'Bullet list',
  'list-number': 'Numbered list',
  blockquote: 'Blockquote',
  code: 'Code',
  link: 'Insert link',
  image: 'Insert image',
}

function applyFormat(
  item: EditorToolbarItem,
  value: string,
  selection: { start: number; end: number },
): { newValue: string; newCursorPos: number } {
  const before = value.slice(0, selection.start)
  const selected = value.slice(selection.start, selection.end)
  const after = value.slice(selection.end)
  const hasSelection = selection.start !== selection.end

  switch (item) {
    case 'heading': {
      const insert = hasSelection ? `## ${selected}` : '## Heading'
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'bold': {
      const insert = `**${hasSelection ? selected : 'bold text'}**`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'italic': {
      const insert = `*${hasSelection ? selected : 'italic text'}*`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'underline': {
      const insert = `__${hasSelection ? selected : 'underlined text'}__`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'list-bullet': {
      const insert = hasSelection
        ? selected.split('\n').map((line) => `- ${line}`).join('\n')
        : '- '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'list-number': {
      const insert = hasSelection
        ? selected.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n')
        : '1. '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'blockquote': {
      const insert = hasSelection
        ? selected.split('\n').map((line) => `> ${line}`).join('\n')
        : '> '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'code': {
      const insert = hasSelection ? `\`\`\`\n${selected}\n\`\`\`` : '`code`'
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'link': {
      const insert = `[${hasSelection ? selected : 'link text'}](url)`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'image': {
      const insert = '![alt text](image-url)'
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    default:
      return { newValue: value, newCursorPos: selection.end }
  }
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

export interface RichTextEditorBaseProps {
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Placeholder when empty. */
  placeholder?: string
  /** Toolbar entries. */
  toolbar?: EditorToolbarItem[]
  /** Minimum height (px). */
  minHeight?: number
  /** Maximum height (px). */
  maxHeight?: number
  /** Called when text changes. */
  onChangeText?: (value: string) => void
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone RichTextEditor — plain React props, no manifest required.
 *
 * @example
 * <RichTextEditorBase placeholder="Write…" defaultValue="" onChangeText={setMd} />
 */
export function RichTextEditorBase({
  value,
  defaultValue,
  placeholder = 'Start writing...',
  toolbar = ['heading', 'bold', 'italic', 'list-bullet', 'blockquote', 'code'],
  minHeight = 120,
  maxHeight = 400,
  onChangeText,
  style,
  slots,
  testID,
  id,
}: RichTextEditorBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '')
  const currentValue = isControlled ? value! : internalValue

  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [activeItem, setActiveItem] = useState<EditorToolbarItem | null>(null)
  const resolvedMaxHeight = Math.max(minHeight, maxHeight)
  const [inputHeight, setInputHeight] = useState(minHeight)
  const testId = testID ?? id

  const toolbarSurface = resolveSlot(slots, tokens, 'toolbar', {
    backgroundColor: tokens.colors.surface,
    border: '1 border',
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
  })
  const toolbarContentSurface = resolveSlot(slots, tokens, 'toolbarContent', {
    paddingX: 'sm',
    paddingY: 'sm',
    gap: 2,
    alignItems: 'center',
  })
  const toolbarSeparatorSurface = resolveSlot(slots, tokens, 'toolbarSeparator', {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: tokens.colors.divider,
    marginX: 'xs',
  })
  const toolbarButtonSurface = resolveSlot(slots, tokens, 'toolbarButton', {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
  })
  const toolbarLabelSurface = resolveSlot(slots, tokens, 'toolbarLabel', {
    color: 'muted',
    fontSize: 'sm',
    fontWeight: 'medium',
  })
  const inputSurface = resolveSlot(slots, tokens, 'input', {
    backgroundColor: tokens.colors.inputBackground,
    border: '1 border',
    borderTopWidth: 0,
    borderBottomLeftRadius: tokens.radius.lg,
    borderBottomRightRadius: tokens.radius.lg,
    paddingX: 'md',
    paddingY: 'md',
    color: tokens.colors.inputText,
    fontSize: 'base',
  })
  const footerSurface = resolveSlot(slots, tokens, 'footer', {
    flexDirection: 'row',
    justifyContent: 'between',
    paddingTop: 'xs',
    paddingX: 'xs',
  })
  const footerTextSurface = resolveSlot(slots, tokens, 'footerText', {
    color: 'muted',
    fontSize: 'xs',
  })

  const handleChange = useCallback(
    (text: string) => {
      if (!isControlled) {
        setInternalValue(text)
      }
      onChangeText?.(text)
    },
    [isControlled, onChangeText],
  )

  const handleToolbarPress = useCallback(
    (item: EditorToolbarItem) => {
      const { newValue } = applyFormat(item, currentValue, selection)
      handleChange(newValue)
      setActiveItem(item)
      setTimeout(() => setActiveItem(null), 150)
    },
    [currentValue, handleChange, selection],
  )

  return (
    <View testID={testId} style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={toolbarSurface.style as ViewStyle | undefined}
        contentContainerStyle={toolbarContentSurface.style as ViewStyle | undefined}
        accessibilityRole="toolbar"
      >
        {toolbar.map((typedItem, index, all) => {
          const previousItem = index > 0 ? (all[index - 1] as EditorToolbarItem) : null
          const isActive = activeItem === typedItem
          const needsSeparator =
            previousItem != null &&
            ((INLINE_ITEMS.has(previousItem) && !INLINE_ITEMS.has(typedItem)) ||
              (BLOCK_ITEMS.has(previousItem) && !BLOCK_ITEMS.has(typedItem)) ||
              (typedItem === 'heading' && previousItem !== 'heading') ||
              (previousItem === 'heading' && typedItem !== 'heading'))

          const activeButtonSurface = isActive
            ? resolveSlot(slots, tokens, 'toolbarButton', {
                width: 34,
                height: 34,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'md',
                backgroundColor: tokens.colors.primary,
              })
            : toolbarButtonSurface
          const activeLabelSurface = isActive
            ? resolveSlot(slots, tokens, 'toolbarLabel', {
                color: 'primary-foreground',
                fontSize: 'sm',
                fontWeight: 'medium',
              })
            : toolbarLabelSurface

          return (
            <React.Fragment key={typedItem}>
              {needsSeparator ? (
                <View style={toolbarSeparatorSurface.style as ViewStyle | undefined} />
              ) : null}
              <TouchableOpacity
                onPress={() => handleToolbarPress(typedItem)}
                style={activeButtonSurface.style as ViewStyle | undefined}
                accessibilityRole="button"
                accessibilityLabel={TOOLBAR_A11Y[typedItem]}
                testID={testId ? `${testId}-toolbar-${typedItem}` : undefined}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    mergeTextStyle(sharedTextStyle, activeLabelSurface),
                    typedItem === 'heading'
                      ? { fontSize: tokens.typography.fontSizeMd, fontWeight: '700' as const }
                      : null,
                    typedItem === 'bold' ? { fontWeight: '800' as const } : null,
                    typedItem === 'italic' ? { fontStyle: 'italic' as const } : null,
                    typedItem === 'underline'
                      ? { textDecorationLine: 'underline' as const }
                      : null,
                    typedItem === 'code'
                      ? { fontFamily: 'monospace', fontSize: tokens.typography.fontSizeXs }
                      : null,
                  ]}
                  selectable={false}
                >
                  {TOOLBAR_LABELS[typedItem]}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          )
        })}
      </ScrollView>

      <RNTextInput
        value={currentValue}
        onChangeText={handleChange}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onContentSizeChange={(event) => {
          const nextHeight = Math.min(
            Math.max(event.nativeEvent.contentSize.height, minHeight),
            resolvedMaxHeight,
          )
          setInputHeight(nextHeight)
        }}
        multiline
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        style={[
          inputSurface.style as TextStyle | undefined,
          { height: inputHeight as DimensionValue, lineHeight: LINE_HEIGHT },
          focused ? { borderColor: tokens.colors.borderFocus } : null,
        ]}
        testID={testId ? `${testId}-input` : undefined}
        accessibilityLabel={placeholder ?? 'Rich text editor'}
        accessibilityRole="text"
        textAlignVertical="top"
      />

      <View style={footerSurface.style as ViewStyle | undefined}>
        <Text style={mergeTextStyle(sharedTextStyle, footerTextSurface)}>
          Markdown supported
        </Text>
        <Text style={mergeTextStyle(sharedTextStyle, footerTextSurface)}>
          {`${currentValue.length} chars`}
        </Text>
      </View>
    </View>
  )
}
