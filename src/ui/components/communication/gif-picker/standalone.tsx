import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
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

const NUM_COLUMNS = 2
const GIF_HEIGHT = 150
const SEARCH_DEBOUNCE_MS = 400

export interface GifResult {
  id: string
  url: string
  preview: string
  width: number
  height: number
}

export interface GifPickerBaseProps {
  /** Visible state. */
  visible: boolean
  /** Called when picker requests close. */
  onClose: () => void
  /** Called when a gif is selected. */
  onSelect: (gif: GifResult) => void
  /** Called when search query changes (debounced). Use to fetch results. */
  onSearch?: (query: string) => void | Promise<void>
  /** Search results to render. */
  results?: GifResult[]
  /** Whether a search is in progress. */
  searching?: boolean
  /** Sample/curated gifs shown when no apiEndpoint configured. */
  sampleGifs?: GifResult[]
  /** Provider name for attribution. */
  provider?: 'giphy' | 'tenor'
  /** Search input placeholder. */
  placeholder?: string
  /** Whether the picker has a configured search endpoint. */
  hasEndpoint?: boolean
  /** Render the built-in trigger button. */
  showTrigger?: boolean
  /** Called when the built-in trigger is pressed. */
  onOpen?: () => void
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone GifPicker — plain React props, no manifest required.
 *
 * @example
 * <GifPickerBase visible={open} onClose={...} onSelect={...} onSearch={...} />
 */
export function GifPickerBase({
  visible,
  onClose,
  onSelect,
  onSearch,
  results,
  searching,
  sampleGifs,
  provider,
  placeholder = 'Search GIFs...',
  hasEndpoint,
  showTrigger = false,
  onOpen,
  style,
  testID,
  id,
}: GifPickerBaseProps) {
  const tokens = useTokens()
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const slideAnim = useRef(new Animated.Value(0)).current
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const hasSamples = !!(sampleGifs && sampleGifs.length > 0)

  useEffect(() => {
    if (visible) {
      setSearchQuery('')
      setHasSearched(false)
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

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text)
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (!text.trim()) {
        setHasSearched(false)
        return
      }
      searchTimerRef.current = setTimeout(() => {
        setHasSearched(true)
        if (onSearch) void onSearch(text)
      }, SEARCH_DEBOUNCE_MS)
    },
    [onSearch],
  )

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] })
  const backdropOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

  const renderGif = useCallback(
    ({ item }: { item: GifResult }) => (
      <TouchableOpacity
        onPress={() => onSelect(item)}
        style={styles.gifCell}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Select GIF"
        testID={testID ? `${testID}-gif-${item.id}` : `gif-${item.id}`}
      >
        <Image
          source={{ uri: item.preview || item.url }}
          style={styles.gifImage}
          resizeMode="cover"
          accessibilityLabel="GIF preview"
        />
      </TouchableOpacity>
    ),
    [onSelect, styles, testID],
  )

  const keyExtractor = useCallback((item: GifResult) => item.id, [])

  return (
    <View style={style} testID={testID ?? id}>
      {showTrigger ? (
        <TouchableOpacity
          onPress={onOpen}
          style={styles.trigger}
          accessibilityRole="button"
          accessibilityLabel="Open GIF picker"
          accessibilityState={{ expanded: visible }}
          testID={testID ? `${testID}-trigger` : 'gif-picker-trigger'}
        >
          <Text style={styles.triggerLabel}>GIF</Text>
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
          accessibilityLabel="Close GIF picker"
        >
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <RNTextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={placeholder}
              placeholderTextColor={tokens.colors.inputPlaceholder}
              accessibilityLabel="Search GIFs"
              testID={testID ? `${testID}-search` : 'gif-picker-search'}
              editable={hasEndpoint || hasSamples}
            />

            {!hasEndpoint && !hasSamples ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyText}>Configure search to enable GIFs</Text>
              </View>
            ) : !hasEndpoint && hasSamples ? (
              <FlatList
                data={sampleGifs}
                renderItem={renderGif}
                keyExtractor={keyExtractor}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                testID={testID ? `${testID}-grid` : 'gif-picker-grid'}
              />
            ) : searching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={tokens.colors.primary} />
              </View>
            ) : (
              <FlatList
                data={results ?? []}
                renderItem={renderGif}
                keyExtractor={keyExtractor}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                testID={testID ? `${testID}-grid` : 'gif-picker-grid'}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyText}>
                      {hasSearched ? 'No GIFs found' : 'Search for GIFs to get started'}
                    </Text>
                  </View>
                }
              />
            )}

            {provider && (
              <View style={styles.attribution}>
                <Text style={styles.attributionText}>
                  Powered by {provider === 'giphy' ? 'GIPHY' : 'Tenor'}
                </Text>
              </View>
            )}
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
    },
    triggerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightBold,
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
      maxHeight: 480,
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
    gridContent: { paddingHorizontal: tokens.spacing[2], gap: tokens.spacing[2] },
    gifCell: {
      flex: 1,
      margin: tokens.spacing[1],
      borderRadius: tokens.radius.md,
      overflow: 'hidden',
      backgroundColor: tokens.colors.surfaceAlt,
    },
    gifImage: { width: '100%', height: GIF_HEIGHT },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[10],
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[10],
      paddingHorizontal: tokens.spacing[4],
    },
    emptyIcon: { fontSize: 36, marginBottom: tokens.spacing[2] },
    emptyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      textAlign: 'center',
    },
    attribution: {
      alignItems: 'center',
      paddingTop: tokens.spacing[2],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.divider,
      marginHorizontal: tokens.spacing[3],
    },
    attributionText: { fontSize: tokens.typography.fontSizeXs, color: tokens.colors.textMuted },
  })
}
