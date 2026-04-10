import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput as RNTextInput } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { RichInputConfig, ToolbarItem } from './types'

const LINE_HEIGHT = 22

// ── Toolbar config ─────────────────────────────────────────────────────────────

const TOOLBAR_LABELS: Record<ToolbarItem, string> = {
  bold: 'B',
  italic: 'I',
  underline: 'U',
  strikethrough: 'S̶',
  code: '`',
  'list-bullet': '•',
  'list-number': '1.',
  link: '🔗',
  quote: '"',
}

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

/**
 * Apply markdown formatting to a text value given the current selection.
 */
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
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 0 : 2),
      }
    }
    case 'italic': {
      const placeholder = hasSelection ? selected : 'italic text'
      const insert = `*${placeholder}*`
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 0 : 1),
      }
    }
    case 'underline': {
      const placeholder = hasSelection ? selected : 'underlined text'
      const insert = `__${placeholder}__`
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 0 : 2),
      }
    }
    case 'strikethrough': {
      const placeholder = hasSelection ? selected : 'struck text'
      const insert = `~~${placeholder}~~`
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 0 : 2),
      }
    }
    case 'code': {
      const placeholder = hasSelection ? selected : 'code'
      const insert = '`' + placeholder + '`'
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 0 : 1),
      }
    }
    case 'list-bullet': {
      if (hasSelection) {
        const lines = selected.split('\n').map((l) => `- ${l}`)
        const insert = lines.join('\n')
        return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
      }
      return { newValue: before + '- ' + after, newCursorPos: selection.start + 2 }
    }
    case 'list-number': {
      if (hasSelection) {
        const lines = selected.split('\n').map((l, i) => `${i + 1}. ${l}`)
        const insert = lines.join('\n')
        return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
      }
      return { newValue: before + '1. ' + after, newCursorPos: selection.start + 3 }
    }
    case 'quote': {
      if (hasSelection) {
        const lines = selected.split('\n').map((l) => `> ${l}`)
        const insert = lines.join('\n')
        return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
      }
      return { newValue: before + '> ' + after, newCursorPos: selection.start + 2 }
    }
    case 'link': {
      const placeholder = hasSelection ? selected : 'link text'
      const insert = `[${placeholder}](url)`
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 1 : 5),
      }
    }
    default:
      return { newValue: value, newCursorPos: selection.end }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RichInput({ config }: { config: RichInputConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const [localValue, setLocalValue] = useState<string>(
    (resolvedValue as string | undefined) ?? config.defaultValue ?? '',
  )
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [activeItem, setActiveItem] = useState<ToolbarItem | null>(null)
  const [inputHeight, setInputHeight] = useState((config.minRows ?? 4) * LINE_HEIGHT)
  const inputRef = useRef<RNTextInput>(null)

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as string)
    }
  }, [resolvedValue])

  const minHeight = (config.minRows ?? 4) * LINE_HEIGHT
  const maxHeight = (config.maxRows ?? 12) * LINE_HEIGHT

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      setValue(config.id, text)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, setValue, dispatch],
  )

  const handleToolbarPress = useCallback(
    (item: ToolbarItem) => {
      const { newValue } = applyFormatting(item, localValue, selection)
      handleChange(newValue)

      // Brief active indicator
      setActiveItem(item)
      setTimeout(() => setActiveItem(null), 150)
    },
    [localValue, selection, handleChange],
  )

  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      const h = Math.min(Math.max(e.nativeEvent.contentSize.height, minHeight), maxHeight)
      setInputHeight(h)
    },
    [minHeight, maxHeight],
  )

  const styles = useMemo(() => makeStyles(tokens, focused), [tokens, focused])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View testID={config.testID ?? config.id}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}

        {/* Toolbar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.toolbar}
          contentContainerStyle={styles.toolbarContent}
          accessibilityRole="toolbar"
        >
          {(config.toolbar ?? ['bold', 'italic', 'code', 'list-bullet']).map((item) => {
            const isActive = activeItem === item
            return (
              <TouchableOpacity
                key={item}
                onPress={() => handleToolbarPress(item as ToolbarItem)}
                style={[styles.toolbarButton, isActive && styles.toolbarButtonActive]}
                accessibilityRole="button"
                accessibilityLabel={TOOLBAR_A11Y[item as ToolbarItem]}
                testID={`${config.testID ?? config.id}-toolbar-${item}`}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.toolbarLabel, isActive && styles.toolbarLabelActive]}
                  selectable={false}
                >
                  {TOOLBAR_LABELS[item as ToolbarItem]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Input */}
        <RNTextInput
          ref={inputRef}
          value={localValue}
          onChangeText={handleChange}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onContentSizeChange={handleContentSizeChange}
          multiline
          placeholder={config.placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          style={[styles.input, { height: inputHeight }]}
          testID={`${config.testID ?? config.id}-input`}
          accessibilityLabel={config.label ?? config.placeholder ?? 'Rich text input'}
          accessibilityRole="text"
          textAlignVertical="top"
        />
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, focused: boolean) {
  return StyleSheet.create({
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    toolbar: {
      borderTopLeftRadius: tokens.radius.md,
      borderTopRightRadius: tokens.radius.md,
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: focused ? tokens.colors.borderFocus : tokens.colors.inputBorder,
      borderBottomWidth: 0,
    },
    toolbarContent: {
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[1],
      gap: tokens.spacing[1],
    },
    toolbarButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.sm,
      backgroundColor: tokens.colors.surfaceAlt,
    },
    toolbarButtonActive: {
      backgroundColor: tokens.colors.primary,
    },
    toolbarLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    toolbarLabelActive: {
      color: tokens.colors.primaryForeground,
    },
    input: {
      backgroundColor: tokens.colors.inputBackground,
      borderWidth: 1,
      borderColor: focused ? tokens.colors.borderFocus : tokens.colors.inputBorder,
      borderTopWidth: 0,
      borderBottomLeftRadius: tokens.radius.md,
      borderBottomRightRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      lineHeight: LINE_HEIGHT,
    },
  })
}
