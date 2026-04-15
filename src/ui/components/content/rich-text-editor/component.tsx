import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  Alert,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { RichTextEditorConfig, EditorToolbarItem } from './types'

const LINE_HEIGHT = 22

// ── Toolbar config ────────────────────────────────────────────────────────────

const TOOLBAR_LABELS: Record<EditorToolbarItem, string> = {
  heading: 'H',
  bold: 'B',
  italic: 'I',
  underline: 'U',
  'list-bullet': '≡',
  'list-number': '1.',
  blockquote: '❝',
  code: '</>',
  link: '⟁',
  image: '▣',
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

// ── Formatting helpers ────────────────────────────────────────────────────────

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
      // Insert ## at the start of the current line
      const lineStart = before.lastIndexOf('\n') + 1
      const linePrefix = value.slice(lineStart, selection.start)
      // Cycle through heading levels: none -> ## -> ### -> remove
      const headingMatch = /^(#{1,6})\s/.exec(linePrefix)
      if (headingMatch) {
        const level = headingMatch[1].length
        if (level >= 3) {
          // Remove heading
          const newBefore = before.slice(0, lineStart) + linePrefix.slice(level + 1)
          return {
            newValue: newBefore + selected + after,
            newCursorPos: newBefore.length + selected.length,
          }
        }
        // Increase level
        const newBefore = before.slice(0, lineStart) + '#' + linePrefix
        return {
          newValue: newBefore + selected + after,
          newCursorPos: newBefore.length + selected.length,
        }
      }
      const newBefore = before.slice(0, lineStart) + '## ' + linePrefix
      return {
        newValue: newBefore + selected + after,
        newCursorPos: newBefore.length + selected.length,
      }
    }
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
    case 'list-bullet': {
      if (hasSelection) {
        const lines = selected.split('\n').map((l) => `- ${l}`)
        const insert = lines.join('\n')
        return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
      }
      const insert = '\n- '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'list-number': {
      if (hasSelection) {
        const lines = selected.split('\n').map((l, i) => `${i + 1}. ${l}`)
        const insert = lines.join('\n')
        return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
      }
      const insert = '\n1. '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'blockquote': {
      if (hasSelection) {
        const lines = selected.split('\n').map((l) => `> ${l}`)
        const insert = lines.join('\n')
        return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
      }
      const insert = '\n> '
      return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
    }
    case 'code': {
      if (hasSelection && selected.includes('\n')) {
        const insert = '```\n' + selected + '\n```'
        return { newValue: before + insert + after, newCursorPos: selection.start + insert.length }
      }
      const placeholder = hasSelection ? selected : 'code'
      const insert = '`' + placeholder + '`'
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 0 : 1),
      }
    }
    case 'link': {
      const placeholder = hasSelection ? selected : 'link text'
      const insert = `[${placeholder}](url)`
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length - (hasSelection ? 1 : 5),
      }
    }
    case 'image': {
      const insert = '![alt text](image-url)'
      return {
        newValue: before + insert + after,
        newCursorPos: selection.start + insert.length,
      }
    }
    default:
      return { newValue: value, newCursorPos: selection.end }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RichTextEditor({ config }: { config: RichTextEditorConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [localValue, setLocalValue] = useState<string>(config.defaultValue ?? '')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [activeItem, setActiveItem] = useState<EditorToolbarItem | null>(null)
  const inputRef = useRef<RNTextInput>(null)

  const minHeight = config.minHeight ?? 120
  const maxHeight = config.maxHeight ?? 400
  const [inputHeight, setInputHeight] = useState(minHeight)

  // Publish initial value
  useEffect(() => {
    if (config.defaultValue) {
      setValue(config.id, config.defaultValue)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    (item: EditorToolbarItem) => {
      const { newValue } = applyFormat(item, localValue, selection)
      handleChange(newValue)
      setActiveItem(item)
      const timer = setTimeout(() => setActiveItem(null), 150)
      return () => clearTimeout(timer)
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

  const testId = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        {/* Toolbar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.toolbar}
          contentContainerStyle={styles.toolbarContent}
          accessibilityRole="toolbar"
        >
          {(config.toolbar ?? ['heading', 'bold', 'italic', 'list-bullet', 'blockquote', 'code']).map(
            (item, idx, arr) => {
              const isActive = activeItem === item
              const typedItem = item as EditorToolbarItem
              const prevItem = idx > 0 ? (arr[idx - 1] as EditorToolbarItem) : null
              const needsSeparator =
                prevItem != null &&
                ((INLINE_ITEMS.has(prevItem) && !INLINE_ITEMS.has(typedItem)) ||
                 (BLOCK_ITEMS.has(prevItem) && !BLOCK_ITEMS.has(typedItem)) ||
                 (typedItem === 'heading' && prevItem !== 'heading') ||
                 (prevItem === 'heading' && typedItem !== 'heading'))

              return (
                <React.Fragment key={item}>
                  {needsSeparator && <View style={styles.toolbarSeparator} />}
                  <TouchableOpacity
                    onPress={() => handleToolbarPress(typedItem)}
                    style={[styles.toolbarButton, isActive && styles.toolbarButtonActive]}
                    accessibilityRole="button"
                    accessibilityLabel={TOOLBAR_A11Y[typedItem]}
                    testID={`${testId}-toolbar-${item}`}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.toolbarLabel,
                        isActive && styles.toolbarLabelActive,
                        typedItem === 'heading' && styles.toolbarLabelHeading,
                        typedItem === 'bold' && { fontWeight: '800' as const },
                        typedItem === 'italic' && { fontStyle: 'italic' as const },
                        typedItem === 'underline' && { textDecorationLine: 'underline' as const },
                        typedItem === 'code' && styles.toolbarLabelMono,
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

        {/* Editor input */}
        <RNTextInput
          ref={inputRef}
          value={localValue}
          onChangeText={handleChange}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onContentSizeChange={handleContentSizeChange}
          multiline
          placeholder={config.placeholder ?? 'Start writing...'}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          style={[styles.input, { height: inputHeight }]}
          testID={`${testId}-input`}
          accessibilityLabel={config.placeholder ?? 'Rich text editor'}
          accessibilityRole="text"
          textAlignVertical="top"
        />

        {/* Character count hint */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Markdown supported</Text>
          <Text style={styles.footerText}>{localValue.length} chars</Text>
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, focused: boolean) {
  return StyleSheet.create({
    toolbar: {
      borderTopLeftRadius: tokens.radius.lg,
      borderTopRightRadius: tokens.radius.lg,
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: focused ? tokens.colors.borderFocus : tokens.colors.inputBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    toolbarContent: {
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[2],
      gap: 2,
      alignItems: 'center',
    },
    toolbarSeparator: {
      width: StyleSheet.hairlineWidth,
      height: 20,
      backgroundColor: tokens.colors.divider,
      marginHorizontal: tokens.spacing[1],
    },
    toolbarButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.md,
    },
    toolbarButtonActive: {
      backgroundColor: tokens.colors.primary,
    },
    toolbarLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.textMuted,
    },
    toolbarLabelActive: {
      color: tokens.colors.primaryForeground,
    },
    toolbarLabelHeading: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightBold,
    },
    toolbarLabelMono: {
      fontSize: tokens.typography.fontSizeXs,
      fontFamily: 'monospace',
      letterSpacing: -0.5,
    },
    input: {
      backgroundColor: tokens.colors.inputBackground,
      borderWidth: 1,
      borderColor: focused ? tokens.colors.borderFocus : tokens.colors.inputBorder,
      borderTopWidth: 0,
      borderBottomLeftRadius: tokens.radius.lg,
      borderBottomRightRadius: tokens.radius.lg,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      lineHeight: LINE_HEIGHT,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: tokens.spacing[1],
      paddingHorizontal: tokens.spacing[1],
    },
    footerText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
  })
}

