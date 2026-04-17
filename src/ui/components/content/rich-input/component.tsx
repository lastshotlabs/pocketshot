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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { RichInputConfig, ToolbarItem } from './types'

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
    case 'quote': {
      const insert = hasSelection
        ? selected.split('\n').map((line) => `> ${line}`).join('\n')
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

function resolveSlotSurface(
  config: RichInputConfig,
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

export function RichInput({ config }: { config: RichInputConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedLabel =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const resolvedPlaceholder =
    config.placeholder != null
      ? String(resolveFromRef(config.placeholder, values) ?? '')
      : undefined

  const [localValue, setLocalValue] = useState<string>(
    String(resolvedValue ?? config.defaultValue ?? ''),
  )
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [activeItem, setActiveItem] = useState<ToolbarItem | null>(null)
  const [inputHeight, setInputHeight] = useState((config.minRows ?? 4) * LINE_HEIGHT)

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(String(resolvedValue))
    }
  }, [resolvedValue])

  const minHeight = (config.minRows ?? 4) * LINE_HEIGHT
  const maxHeight = (config.maxRows ?? 12) * LINE_HEIGHT
  const testId = config.testID ?? config.id

  const labelSurface = resolveSlotSurface(config, tokens, 'label', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'medium',
    marginBottom: 'xs',
  })
  const toolbarSurface = resolveSlotSurface(config, tokens, 'toolbar', {
    backgroundColor: tokens.colors.surface,
    border: '1 border',
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
  })
  const toolbarContentSurface = resolveSlotSurface(config, tokens, 'toolbarContent', {
    paddingX: 'sm',
    paddingY: 'sm',
    gap: 2,
    alignItems: 'center',
  })
  const toolbarSeparatorSurface = resolveSlotSurface(config, tokens, 'toolbarSeparator', {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: tokens.colors.divider,
    marginX: 'xs',
  })
  const toolbarButtonSurface = resolveSlotSurface(config, tokens, 'toolbarButton', {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
    backgroundColor: activeItem != null ? undefined : undefined,
  })
  const toolbarLabelSurface = resolveSlotSurface(config, tokens, 'toolbarLabel', {
    color: 'muted',
    fontSize: 'sm',
    fontWeight: 'medium',
  })
  const inputSurface = resolveSlotSurface(config, tokens, 'input', {
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
      setLocalValue(text)
      setValue(config.id, text)
      if (config.onChangeAction != null) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const handleToolbarPress = useCallback(
    (item: ToolbarItem) => {
      const { newValue } = applyFormatting(item, localValue, selection)
      handleChange(newValue)
      setActiveItem(item)
      setTimeout(() => setActiveItem(null), 150)
    },
    [handleChange, localValue, selection],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        {resolvedLabel != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, labelSurface)} accessibilityRole="text">
            {resolvedLabel}
          </Text>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={toolbarSurface.style as ViewStyle | undefined}
          contentContainerStyle={toolbarContentSurface.style as ViewStyle | undefined}
          accessibilityRole="toolbar"
        >
          {(config.toolbar ?? ['bold', 'italic', 'code', 'list-bullet']).map((item, index, all) => {
            const typedItem = item as ToolbarItem
            const previousItem = index > 0 ? (all[index - 1] as ToolbarItem) : null
            const isActive = activeItem === typedItem
            const needsSeparator =
              previousItem != null &&
              ((INLINE_ITEMS.has(previousItem) && !INLINE_ITEMS.has(typedItem)) ||
                (BLOCK_ITEMS.has(previousItem) && !BLOCK_ITEMS.has(typedItem)))

            const activeButtonSurface = isActive
              ? resolveSlotSurface(config, tokens, 'toolbarButton', {
                  width: 34,
                  height: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'md',
                  backgroundColor: tokens.colors.primary,
                })
              : toolbarButtonSurface
            const activeLabelSurface = isActive
              ? resolveSlotSurface(config, tokens, 'toolbarLabel', {
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
                  testID={`${testId}-toolbar-${typedItem}`}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      mergeTextStyle(sharedTextStyle, activeLabelSurface),
                      typedItem === 'bold' ? { fontWeight: '800' as const } : null,
                      typedItem === 'italic' ? { fontStyle: 'italic' as const } : null,
                      typedItem === 'underline'
                        ? { textDecorationLine: 'underline' as const }
                        : null,
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
          value={localValue}
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
          placeholder={resolvedPlaceholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          style={[
            inputSurface.style as TextStyle | undefined,
            { height: inputHeight, lineHeight: LINE_HEIGHT },
            focused ? { borderColor: tokens.colors.borderFocus } : null,
          ]}
          testID={`${testId}-input`}
          accessibilityLabel={resolvedLabel ?? resolvedPlaceholder ?? 'Rich text input'}
          accessibilityRole="text"
          textAlignVertical="top"
        />
      </View>
    </ComponentWrapper>
  )
}
