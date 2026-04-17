import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import {
  resolveNativeStyleProps,
  resolveNativeTextStyle,
  resolveSurfacePresentation,
  toNumericDimensionValue,
} from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { EditorToolbarItem, RichTextEditorConfig } from './types'

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

function resolveEditorHeights(
  tokens: DesignTokens,
  config: RichTextEditorConfig,
): { minHeight: number; maxHeight: number } {
  const resolvedStyle = resolveNativeStyleProps(
    {
      minHeight: config.minHeight,
      maxHeight: config.maxHeight,
    },
    tokens,
  )

  const resolvedMinHeight = toNumericDimensionValue(resolvedStyle.minHeight) ?? 120
  const resolvedMaxHeight = toNumericDimensionValue(resolvedStyle.maxHeight) ?? 400

  return {
    minHeight: resolvedMinHeight,
    maxHeight: Math.max(resolvedMinHeight, resolvedMaxHeight),
  }
}

function resolveSlotSurface(
  config: RichTextEditorConfig,
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

export function RichTextEditor({ config }: { config: RichTextEditorConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const [localValue, setLocalValue] = useState<string>(config.defaultValue ?? '')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [activeItem, setActiveItem] = useState<EditorToolbarItem | null>(null)
  const { minHeight, maxHeight } = useMemo(() => resolveEditorHeights(tokens, config), [config, tokens])
  const [inputHeight, setInputHeight] = useState(minHeight)
  const testId = config.testID ?? config.id

  useEffect(() => {
    if (config.defaultValue != null) {
      setValue(config.id, config.defaultValue)
    }
  }, [config.defaultValue, config.id, setValue])

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
    paddingY: 'md',
    color: tokens.colors.inputText,
    fontSize: 'base',
  })
  const footerSurface = resolveSlotSurface(config, tokens, 'footer', {
    flexDirection: 'row',
    justifyContent: 'between',
    paddingTop: 'xs',
    paddingX: 'xs',
  })
  const footerTextSurface = resolveSlotSurface(config, tokens, 'footerText', {
    color: 'muted',
    fontSize: 'xs',
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
    (item: EditorToolbarItem) => {
      const { newValue } = applyFormat(item, localValue, selection)
      handleChange(newValue)
      setActiveItem(item)
      setTimeout(() => setActiveItem(null), 150)
    },
    [handleChange, localValue, selection],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={toolbarSurface.style as ViewStyle | undefined}
          contentContainerStyle={toolbarContentSurface.style as ViewStyle | undefined}
          accessibilityRole="toolbar"
        >
          {(config.toolbar ?? ['heading', 'bold', 'italic', 'list-bullet', 'blockquote', 'code']).map(
            (item, index, all) => {
              const typedItem = item as EditorToolbarItem
              const previousItem = index > 0 ? (all[index - 1] as EditorToolbarItem) : null
              const isActive = activeItem === typedItem
              const needsSeparator =
                previousItem != null &&
                ((INLINE_ITEMS.has(previousItem) && !INLINE_ITEMS.has(typedItem)) ||
                  (BLOCK_ITEMS.has(previousItem) && !BLOCK_ITEMS.has(typedItem)) ||
                  (typedItem === 'heading' && previousItem !== 'heading') ||
                  (previousItem === 'heading' && typedItem !== 'heading'))

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
            },
          )}
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
          placeholder={config.placeholder ?? 'Start writing...'}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          style={[
            inputSurface.style as TextStyle | undefined,
            { height: inputHeight as DimensionValue, lineHeight: LINE_HEIGHT },
            focused ? { borderColor: tokens.colors.borderFocus } : null,
          ]}
          testID={`${testId}-input`}
          accessibilityLabel={config.placeholder ?? 'Rich text editor'}
          accessibilityRole="text"
          textAlignVertical="top"
        />

        <View style={footerSurface.style as ViewStyle | undefined}>
          <Text style={mergeTextStyle(sharedTextStyle, footerTextSurface)}>
            Markdown supported
          </Text>
          <Text style={mergeTextStyle(sharedTextStyle, footerTextSurface)}>
            {`${localValue.length} chars`}
          </Text>
        </View>
      </View>
    </ComponentWrapper>
  )
}
