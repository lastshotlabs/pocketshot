import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  FlatList,
  TextInput as RNTextInput,
  Modal,
  ScrollView,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { EmojiPickerConfig, EmojiCategory } from './types'

// ── Emoji data ────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '🥲', '😋', '😛', '😜', '🤪', '😝',
    ],
  },
  {
    name: 'People',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏',
    ],
  },
  {
    name: 'Animals',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔',
      '🐧', '🐦', '🐤', '🦄', '🐝', '🦋',
    ],
  },
  {
    name: 'Food',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🌶️',
      '🌽', '🥕', '🧄', '🧅', '🥔', '🍠',
    ],
  },
  {
    name: 'Travel',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '✈️', '🚀', '🛸', '🚁', '⛵', '🚤', '🛥️', '🏠',
      '🏡', '🏢', '🏣', '🏥', '🏦', '🏰',
    ],
  },
  {
    name: 'Activities',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🏓', '🏸', '🏒', '🥊', '🎿', '⛷️', '🏂', '🏄', '🏊', '🧗',
      '🎮', '🎲', '♟️', '🎯', '🎳', '🎸',
    ],
  },
  {
    name: 'Objects',
    emojis: [
      '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📷',
      '📹', '🎥', '📞', '☎️', '📺', '📻', '🔋', '🔌', '💡', '🔦',
      '🕯️', '🧯', '💰', '💳', '💎', '🔧',
    ],
  },
  {
    name: 'Symbols',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '🌟',
      '💫', '⭐', '🔥', '💥', '❄️', '🎵',
    ],
  },
  {
    name: 'Flags',
    emojis: [
      '🏳️', '🏴', '🏁', '🚩', '🎌', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇸', '🇬🇧',
      '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇯🇵', '🇰🇷', '🇨🇳', '🇧🇷', '🇮🇳', '🇨🇦',
      '🇦🇺', '🇲🇽', '🇷🇺', '🇿🇦', '🇸🇪', '🇳🇴',
    ],
  },
]

const NUM_COLUMNS = 8

// ── EmojiPicker ───────────────────────────────────────────────────────────────

export function EmojiPicker({ config }: { config: EmojiPickerConfig }) {
  const tokens = useTokens()
  const { dispatch, setValue } = useScreenContext()

  const [visible, setVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(0)
  const slideAnim = useRef(new Animated.Value(0)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const categories = useMemo<EmojiCategory[]>(() => {
    if (config.categories && config.categories.length > 0) {
      return DEFAULT_CATEGORIES.filter((c) => config.categories!.includes(c.name))
    }
    return DEFAULT_CATEGORIES
  }, [config.categories])

  // Publish visibility to ScreenContext
  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, visible, setValue])

  const openPicker = useCallback(() => {
    setVisible(true)
    setSearchQuery('')
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start()
  }, [slideAnim])

  const closePicker = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false))
  }, [slideAnim])

  const handleSelect = useCallback(
    (emoji: string) => {
      setValue('__selectedEmoji', { emoji })
      closePicker()
      void dispatch(config.onSelect)
    },
    [setValue, closePicker, dispatch, config.onSelect],
  )

  // Build filtered data for FlatList
  const filteredEmojis = useMemo<string[]>(() => {
    if (searchQuery.trim()) {
      // Simple search: filter all emojis (since we can't search by name with just the emoji)
      // We flatten all categories and return them — real search would need emoji metadata
      const all = categories.flatMap((c) => c.emojis)
      return all
    }

    // If showing "Recent" and we have recent emojis
    if (selectedCategory === -1 && config.recentEmojis && config.recentEmojis.length > 0) {
      return config.recentEmojis
    }

    const cat = categories[selectedCategory]
    return cat ? cat.emojis : []
  }, [searchQuery, selectedCategory, categories, config.recentEmojis])

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  })

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const renderEmoji = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        style={styles.emojiCell}
        accessibilityRole="button"
        accessibilityLabel={`Select emoji ${item}`}
        testID={config.testID ? `${config.testID}-emoji-${item}` : `emoji-${item}`}
      >
        <Text style={styles.emojiText}>{item}</Text>
      </TouchableOpacity>
    ),
    [handleSelect, styles, config.testID],
  )

  const keyExtractor = useCallback((item: string, index: number) => `${item}-${index}`, [])

  const hasRecent = config.recentEmojis && config.recentEmojis.length > 0

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {/* Trigger */}
      <TouchableOpacity
        onPress={openPicker}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel="Open emoji picker"
        accessibilityState={{ expanded: visible }}
        testID={config.testID ? `${config.testID}-trigger` : 'emoji-picker-trigger'}
      >
        <Text style={styles.triggerEmoji}>😀</Text>
        <Text style={styles.triggerLabel}>Emoji</Text>
      </TouchableOpacity>

      {/* Modal bottom sheet */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closePicker}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={closePicker} accessibilityLabel="Close emoji picker">
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY }] }]}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Search */}
            <RNTextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search emojis..."
              placeholderTextColor={tokens.colors.inputPlaceholder}
              accessibilityLabel="Search emojis"
              testID={config.testID ? `${config.testID}-search` : 'emoji-picker-search'}
            />

            {/* Category tabs */}
            {!searchQuery.trim() && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
              >
                {hasRecent && (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(-1)}
                    style={[
                      styles.tab,
                      selectedCategory === -1 && styles.tabActive,
                    ]}
                    accessibilityRole="tab"
                    accessibilityLabel="Recent emojis"
                    accessibilityState={{ selected: selectedCategory === -1 }}
                    testID={config.testID ? `${config.testID}-tab-recent` : 'emoji-tab-recent'}
                  >
                    <Text style={styles.tabText}>🕐</Text>
                  </TouchableOpacity>
                )}
                {categories.map((cat, idx) => (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => setSelectedCategory(idx)}
                    style={[
                      styles.tab,
                      selectedCategory === idx && styles.tabActive,
                    ]}
                    accessibilityRole="tab"
                    accessibilityLabel={cat.name}
                    accessibilityState={{ selected: selectedCategory === idx }}
                    testID={
                      config.testID
                        ? `${config.testID}-tab-${cat.name.toLowerCase()}`
                        : `emoji-tab-${cat.name.toLowerCase()}`
                    }
                  >
                    <Text style={styles.tabText}>{cat.emojis[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Emoji grid */}
            <FlatList
              data={filteredEmojis}
              renderItem={renderEmoji}
              keyExtractor={keyExtractor}
              numColumns={NUM_COLUMNS}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              testID={config.testID ? `${config.testID}-grid` : 'emoji-picker-grid'}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No emojis found</Text>
                </View>
              }
            />
          </View>
        </Animated.View>
      </Modal>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    triggerEmoji: {
      fontSize: tokens.typography.fontSizeLg,
    },
    triggerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tokens.colors.overlay,
    },
    sheetContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
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
    tabActive: {
      backgroundColor: tokens.colors.surfaceAlt,
    },
    tabText: {
      fontSize: tokens.typography.fontSizeLg,
    },
    gridContent: {
      paddingHorizontal: tokens.spacing[2],
    },
    emojiCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[2],
    },
    emojiText: {
      fontSize: tokens.typography.fontSize2xl,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[8],
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
  })
}
