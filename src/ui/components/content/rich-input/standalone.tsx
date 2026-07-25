import React, { useCallback, useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ToolbarItem } from './types'

const LINE_HEIGHT = 22

const TOOLBAR_LABELS: Record<ToolbarItem, string> = {
  bold: 'B',
  italic: 'I',
  underline: 'U',
  strikethrough: 'S',
  code: '</>',
  'list-bullet': '-',
  'list-number': '1.',
  link: 'Link',
  quote: '"',
}

const INLINE_ITEMS = new Set<ToolbarItem>(['bold', 'italic', 'underline', 'strikethrough'])
const BLOCK_ITEMS = new Set<ToolbarItem>(['list-bullet', 'list-number', 'quote'])

const TOOLBAR_A11Y: Record<ToolbarItem, string> = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  code: 'Inline code',
  'list-bullet': 'Bullet list',
  'list-number': 'Numbered list',
  link: 'Link',
  quote: 'Blockquote',
}

function applyFormatting(
  item: ToolbarItem,
  value: string,
  selection: { start: number; end: number },
): { newValue: string; newCursorPos: number } {
  const before = value.slice(0, selection.start)
  const selected = value.slice(selection.start, selection.end)
  const after = value.slice(selection.end)
  const hasSelection = selection.start !== selection.end

  switch (item) {
    case 'bold': {
      const placeholder = hasSelection ? selected : 'bold text'
      const insert = `**${placeholder}**`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'italic': {
      const placeholder = hasSelection ? selected : 'italic text'
      const insert = `*${placeholder}*`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'underline': {
      const placeholder = hasSelection ? selected : 'underlined text'
      const insert = `__${placeholder}__`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'strikethrough': {
      const placeholder = hasSelection ? selected : 'struck text'
      const insert = `~~${placeholder}~~`
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'code': {
      const placeholder = hasSelection ? selected : 'code'
      const insert = '`' + placeholder + '`'
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'list-bullet': {
      const insert = hasSelection
        ? selected
            .split('\n')
            .map((line) => `- ${line}`)
            .join('\n')
        : '- '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'list-number': {
      const insert = hasSelection
        ? selected
            .split('\n')
            .map((line, index) => `${index + 1}. ${line}`)
            .join('\n')
        : '1. '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'quote': {
      const insert = hasSelection
        ? selected
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
        : '> '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'link': {
      const placeholder = hasSelection ? selected : 'link text'
      const insert = `[${placeholder}](url)`
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

export interface RichInputBaseProps {
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Visible label. */
  label?: string
  /** Placeholder when empty. */
  placeholder?: string
  /** Toolbar entries shown above the input. */
  toolbar?: ToolbarItem[]
  /** Minimum visible rows. */
  minRows?: number
  /** Maximum visible rows before scrolling. */
  maxRows?: number
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
 * Standalone RichInput — plain React props, no manifest required.
 *
 * @example
 * <RichInputBase label="Notes" defaultValue="" onChangeText={setText} />
 */
export function RichInputBase({
  value,
  defaultValue,
  label,
  placeholder,
  toolbar = ['bold', 'italic', 'code', 'list-bullet'],
  minRows = 4,
  maxRows = 12,
  onChangeText,
  style,
  slots,
  testID,
  id,
}: RichInputBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '')
  const currentValue = isControlled ? value! : internalValue

  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [activeItem, setActiveItem] = useState<ToolbarItem | null>(null)
  const [inputHeight, setInputHeight] = useState(minRows * LINE_HEIGHT)

  useEffect(() => {
    // tracking value changes is implicit via prop
  }, [value])

  const minHeight = minRows * LINE_HEIGHT
  const maxHeight = maxRows * LINE_HEIGHT
  const testId = testID ?? id

  const labelSurface = resolveSlot(slots, tokens, 'label', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'medium',
    marginBottom: 'xs',
  })
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
    paddingY: 'sm',
    color: tokens.colors.inputText,
    fontSize: 'base',
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
    (item: ToolbarItem) => {
      const { newValue } = applyFormatting(item, currentValue, selection)
      handleChange(newValue)
      setActiveItem(item)
      setTimeout(() => setActiveItem(null), 150)
    },
    [currentValue, handleChange, selection],
  )

  return (
    <View testID={testId} style={style}>
      {label != null ? (
        <Text style={mergeTextStyle(sharedTextStyle, labelSurface)} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={toolbarSurface.style as ViewStyle | undefined}
        contentContainerStyle={toolbarContentSurface.style as ViewStyle | undefined}
        accessibilityRole="toolbar"
      >
        {toolbar.map((typedItem, index, all) => {
          const previousItem = index > 0 ? (all[index - 1] as ToolbarItem) : null
          const isActive = activeItem === typedItem
          const needsSeparator =
            previousItem != null &&
            ((INLINE_ITEMS.has(previousItem) && !INLINE_ITEMS.has(typedItem)) ||
              (BLOCK_ITEMS.has(previousItem) && !BLOCK_ITEMS.has(typedItem)))

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
                    typedItem === 'bold' ? { fontWeight: '800' as const } : null,
                    typedItem === 'italic' ? { fontStyle: 'italic' as const } : null,
                    typedItem === 'underline' ? { textDecorationLine: 'underline' as const } : null,
                    typedItem === 'strikethrough'
                      ? { textDecorationLine: 'line-through' as const }
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
            maxHeight,
          )
          setInputHeight(nextHeight)
        }}
        multiline
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        style={[
          inputSurface.style as TextStyle | undefined,
          { height: inputHeight, lineHeight: LINE_HEIGHT },
          focused ? { borderColor: tokens.colors.borderFocus } : null,
        ]}
        testID={testId ? `${testId}-input` : undefined}
        accessibilityLabel={label ?? placeholder ?? 'Rich text input'}
        accessibilityRole="text"
        textAlignVertical="top"
      />
    </View>
  )
}
