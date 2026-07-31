import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface EmojiCategory {
  name: string
  emojis: string[]
}

export const DEFAULT_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😙',
      '🥲',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
    ],
  },
  {
    name: 'People',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
    ],
  },
  {
    name: 'Animals',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐻‍❄️',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦄',
      '🐝',
      '🦋',
    ],
  },
  {
    name: 'Food',
    emojis: [
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🌶️',
      '🌽',
      '🥕',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
    ],
  },
  {
    name: 'Travel',
    emojis: [
      '🚗',
      '🚕',
      '🚙',
      '🚌',
      '🚎',
      '🏎️',
      '🚓',
      '🚑',
      '🚒',
      '🚐',
      '🛻',
      '🚚',
      '✈️',
      '🚀',
      '🛸',
      '🚁',
      '⛵',
      '🚤',
      '🛥️',
      '🏠',
      '🏡',
      '🏢',
      '🏣',
      '🏥',
      '🏦',
      '🏰',
    ],
  },
  {
    name: 'Activities',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🏓',
      '🏸',
      '🏒',
      '🥊',
      '🎿',
      '⛷️',
      '🏂',
      '🏄',
      '🏊',
      '🧗',
      '🎮',
      '🎲',
      '♟️',
      '🎯',
      '🎳',
      '🎸',
    ],
  },
  {
    name: 'Objects',
    emojis: [
      '⌚',
      '📱',
      '💻',
      '⌨️',
      '🖥️',
      '🖨️',
      '🖱️',
      '💾',
      '💿',
      '📷',
      '📹',
      '🎥',
      '📞',
      '☎️',
      '📺',
      '📻',
      '🔋',
      '🔌',
      '💡',
      '🔦',
      '🕯️',
      '🧯',
      '💰',
      '💳',
      '💎',
      '🔧',
    ],
  },
  {
    name: 'Symbols',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '✨',
      '🌟',
      '💫',
      '⭐',
      '🔥',
      '💥',
      '❄️',
      '🎵',
    ],
  },
  {
    name: 'Flags',
    emojis: [
      '🏳️',
      '🏴',
      '🏁',
      '🚩',
      '🎌',
      '🏳️‍🌈',
      '🏳️‍⚧️',
      '🏴‍☠️',
      '🇺🇸',
      '🇬🇧',
      '🇫🇷',
      '🇩🇪',
      '🇮🇹',
      '🇪🇸',
      '🇯🇵',
      '🇰🇷',
      '🇨🇳',
      '🇧🇷',
      '🇮🇳',
      '🇨🇦',
      '🇦🇺',
      '🇲🇽',
      '🇷🇺',
      '🇿🇦',
      '🇸🇪',
      '🇳🇴',
    ],
  },
]

const NUM_COLUMNS = 8

export interface EmojiPickerBaseProps {
  /** Visible state. */
  visible: boolean
  /** Called when the user requests to close the picker. */
  onClose: () => void
  /** Called when an emoji is selected. */
  onSelect: (emoji: string) => void
  /** Restrict to subset of categories by name. */
  categories?: string[]
  /** Recent emojis to surface in a "Recent" tab. */
  recentEmojis?: string[]
  /** Custom category definitions (defaults to standard set). */
  categoryData?: EmojiCategory[]
  /** Trigger label (when used uncontrolled with built-in trigger). */
  triggerLabel?: string
  /** Render the built-in trigger button. */
  showTrigger?: boolean
  /** Called when the built-in trigger is pressed. */
  onOpen?: () => void
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone EmojiPicker — plain React props, no manifest required.
 *
 * @example
 * <EmojiPickerBase visible={open} onClose={() => setOpen(false)} onSelect={(e) => insertEmoji(e)} />
 */
export function EmojiPickerBase({
  visible,
  onClose,
  onSelect,
  categories,
  recentEmojis,
  categoryData,
  triggerLabel = 'Emoji',
  showTrigger = false,
  onOpen,
  style,
  testID,
  id,
}: EmojiPickerBaseProps) {
  const tokens = useTokens()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const slideAnim = useRef(new Animated.Value(0)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const allCategories = categoryData ?? DEFAULT_EMOJI_CATEGORIES
  const filteredCategories = useMemo<EmojiCategory[]>(() => {
    if (categories && categories.length > 0) {
      return allCategories.filter((c) => categories.includes(c.name))
    }
    return allCategories
  }, [allCategories, categories])

  React.useEffect(() => {
    if (visible) {
      setSearchQuery('')
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }).start()
    } else {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start()
    }
  }, [visible, slideAnim])

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji)
    },
    [onSelect],
  )

  const filteredEmojis = useMemo<string[]>(() => {
    if (searchQuery.trim()) {
      return filteredCategories.flatMap((c) => c.emojis)
    }
    if (selectedCategory === -1 && recentEmojis && recentEmojis.length > 0) {
      return recentEmojis
    }
    const cat = filteredCategories[selectedCategory]
    return cat ? cat.emojis : []
  }, [searchQuery, selectedCategory, filteredCategories, recentEmojis])

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] })
  const backdropOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

  const renderEmoji = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        style={styles.emojiCell}
        accessibilityRole="button"
        accessibilityLabel={`Select emoji ${item}`}
        testID={testID ? `${testID}-emoji-${item}` : `emoji-${item}`}
      >
        <Text style={styles.emojiText}>{item}</Text>
      </TouchableOpacity>
    ),
    [handleSelect, styles, testID],
  )

  const keyExtractor = useCallback((item: string, index: number) => `${item}-${index}`, [])

  const hasRecent = !!(recentEmojis && recentEmojis.length > 0)

  return (
    <View style={style} testID={testID ?? id}>
      {showTrigger ? (
        <TouchableOpacity
          onPress={onOpen}
          style={styles.trigger}
          accessibilityRole="button"
          accessibilityLabel="Open emoji picker"
          accessibilityState={{ expanded: visible }}
          testID={testID ? `${testID}-trigger` : 'emoji-picker-trigger'}
        >
          <Text style={styles.triggerEmoji}>😀</Text>
          <Text style={styles.triggerLabel}>{triggerLabel}</Text>
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close emoji picker"
        >
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <RNTextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search emojis..."
              placeholderTextColor={tokens.colors.inputPlaceholder}
              accessibilityLabel="Search emojis"
              testID={testID ? `${testID}-search` : 'emoji-picker-search'}
            />

            {!searchQuery.trim() && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
              >
                {hasRecent && (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(-1)}
                    style={[styles.tab, selectedCategory === -1 && styles.tabActive]}
                    accessibilityRole="tab"
                    accessibilityLabel="Recent emojis"
                    accessibilityState={{ selected: selectedCategory === -1 }}
                    testID={testID ? `${testID}-tab-recent` : 'emoji-tab-recent'}
                  >
                    <Text style={styles.tabText}>🕐</Text>
                  </TouchableOpacity>
                )}
                {filteredCategories.map((cat, idx) => (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => setSelectedCategory(idx)}
                    style={[styles.tab, selectedCategory === idx && styles.tabActive]}
                    accessibilityRole="tab"
                    accessibilityLabel={cat.name}
                    accessibilityState={{ selected: selectedCategory === idx }}
                    testID={
                      testID
                        ? `${testID}-tab-${cat.name.toLowerCase()}`
                        : `emoji-tab-${cat.name.toLowerCase()}`
                    }
                  >
                    <Text style={styles.tabText}>{cat.emojis[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <FlatList
              data={filteredEmojis}
              renderItem={renderEmoji}
              keyExtractor={keyExtractor}
              numColumns={NUM_COLUMNS}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              testID={testID ? `${testID}-grid` : 'emoji-picker-grid'}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No emojis found</Text>
                </View>
              }
            />
          </View>
        </Animated.View>
      </Modal>
    </View>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[1],
    },
    triggerEmoji: { fontSize: tokens.typography.fontSizeLg },
    triggerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: tokens.colors.overlay,
    },
    sheetContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    sheet: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius['2xl'],
      borderTopRightRadius: tokens.radius['2xl'],
      paddingTop: tokens.spacing[2],
      paddingBottom: tokens.spacing[6],
      maxHeight: 420,
      ...tokens.shadows.xl,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.border,
      alignSelf: 'center',
      marginBottom: tokens.spacing[2],
    },
    searchInput: {
      marginHorizontal: tokens.spacing[3],
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.lg,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.inputText,
      marginBottom: tokens.spacing[2],
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: tokens.spacing[3],
      gap: tokens.spacing[1],
      marginBottom: tokens.spacing[2],
    },
    tab: {
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[1],
      borderRadius: tokens.radius.md,
    },
    tabActive: { backgroundColor: tokens.colors.surfaceAlt },
    tabText: { fontSize: tokens.typography.fontSizeLg },
    gridContent: { paddingHorizontal: tokens.spacing[2] },
    emojiCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[2],
    },
    emojiText: { fontSize: tokens.typography.fontSize2xl },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[8],
    },
    emptyText: { fontSize: tokens.typography.fontSizeSm, color: tokens.colors.textMuted },
  })
}
