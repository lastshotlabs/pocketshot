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
  Image,
  ActivityIndicator,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { useAppContext } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'
import type { GifPickerConfig, GifResult } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────

const NUM_COLUMNS = 2
const GIF_HEIGHT = 150
const SEARCH_DEBOUNCE_MS = 400

// ── GifPicker ─────────────────────────────────────────────────────────────────

export function GifPicker({ config }: { config: GifPickerConfig }) {
  const tokens = useTokens()
  const { api } = useAppContext()
  const { dispatch, setValue } = useScreenContext()

  const [visible, setVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<GifResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const slideAnim = useRef(new Animated.Value(0)).current
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const hasEndpoint = !!config.apiEndpoint
  const hasSamples = config.sampleGifs && config.sampleGifs.length > 0

  // Publish visibility to ScreenContext
  useEffect(() => {
    setValue(config.id, visible)
  }, [config.id, visible, setValue])

  const openPicker = useCallback(() => {
    setVisible(true)
    setSearchQuery('')
    setResults([])
    setHasSearched(false)
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

  const fetchGifs = useCallback(
    async (query: string) => {
      if (!config.apiEndpoint || !query.trim()) {
        setResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const separator = config.apiEndpoint.includes('?') ? '&' : '?'
        const url = `${config.apiEndpoint}${separator}q=${encodeURIComponent(query)}`
        const response = await api.get<{ results: GifResult[] }>(url)
        setResults(response?.results ?? [])
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
        setHasSearched(true)
      }
    },
    [config.apiEndpoint, api],
  )

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text)
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (!text.trim()) {
        setResults([])
        setHasSearched(false)
        return
      }
      searchTimerRef.current = setTimeout(() => {
        void fetchGifs(text)
      }, SEARCH_DEBOUNCE_MS)
    },
    [fetchGifs],
  )

  const handleSelect = useCallback(
    (gif: GifResult) => {
      setValue('__selectedGif', gif)
      closePicker()
      void dispatch(config.onSelect)
    },
    [setValue, closePicker, dispatch, config.onSelect],
  )

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  })

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const renderGif = useCallback(
    ({ item }: { item: GifResult }) => (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        style={styles.gifCell}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Select GIF"
        testID={config.testID ? `${config.testID}-gif-${item.id}` : `gif-${item.id}`}
      >
        <Image
          source={{ uri: item.preview || item.url }}
          style={styles.gifImage}
          resizeMode="cover"
          accessibilityLabel="GIF preview"
        />
      </TouchableOpacity>
    ),
    [handleSelect, styles, config.testID],
  )

  const keyExtractor = useCallback((item: GifResult) => item.id, [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {/* Trigger */}
      <TouchableOpacity
        onPress={openPicker}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel="Open GIF picker"
        accessibilityState={{ expanded: visible }}
        testID={config.testID ? `${config.testID}-trigger` : 'gif-picker-trigger'}
      >
        <Text style={styles.triggerLabel}>GIF</Text>
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
        <TouchableWithoutFeedback onPress={closePicker} accessibilityLabel="Close GIF picker">
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Search */}
            <RNTextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={config.placeholder}
              placeholderTextColor={tokens.colors.inputPlaceholder}
              accessibilityLabel="Search GIFs"
              testID={config.testID ? `${config.testID}-search` : 'gif-picker-search'}
              editable={hasEndpoint || hasSamples}
            />

            {/* Content */}
            {!hasEndpoint && !hasSamples ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyText}>
                  Configure apiEndpoint to enable GIF search
                </Text>
              </View>
            ) : !hasEndpoint && hasSamples ? (
              <FlatList
                data={(config.sampleGifs ?? []).map((g) => ({
                  id: g.id,
                  url: g.url,
                  preview: g.preview ?? g.url,
                  width: g.width ?? 200,
                  height: g.height ?? 150,
                }))}
                renderItem={renderGif}
                keyExtractor={keyExtractor}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                testID={config.testID ? `${config.testID}-grid` : 'gif-picker-grid'}
              />
            ) : isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={tokens.colors.primary} />
              </View>
            ) : (
              <FlatList
                data={results}
                renderItem={renderGif}
                keyExtractor={keyExtractor}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                testID={config.testID ? `${config.testID}-grid` : 'gif-picker-grid'}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyText}>
                      {hasSearched
                        ? 'No GIFs found'
                        : 'Search for GIFs to get started'}
                    </Text>
                  </View>
                }
              />
            )}

            {/* Provider attribution */}
            {config.provider && (
              <View style={styles.attribution}>
                <Text style={styles.attributionText}>
                  Powered by {config.provider === 'giphy' ? 'GIPHY' : 'Tenor'}
                </Text>
              </View>
            )}
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
    },
    triggerLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightBold,
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
    gridContent: {
      paddingHorizontal: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    gifCell: {
      flex: 1,
      margin: tokens.spacing[1],
      borderRadius: tokens.radius.md,
      overflow: 'hidden',
      backgroundColor: tokens.colors.surfaceAlt,
    },
    gifImage: {
      width: '100%',
      height: GIF_HEIGHT,
    },
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
    emptyIcon: {
      fontSize: 36,
      marginBottom: tokens.spacing[2],
    },
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
    attributionText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
  })
}
