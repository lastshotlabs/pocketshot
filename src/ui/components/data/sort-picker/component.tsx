import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Modal as RNModal,
  FlatList,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { SortPickerConfig } from './types'

type SortOption = SortPickerConfig['options'][number]

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.lg,
      borderTopRightRadius: tokens.radius.lg,
      paddingBottom: tokens.spacing[8],
      ...tokens.shadows.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    headerTitle: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.textMuted,
      textAlign: 'center' as const,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
      gap: tokens.spacing[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    optionIcon: {
      fontSize: 16,
      width: 24,
      textAlign: 'center' as const,
    },
    optionLabel: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    optionLabelSelected: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
    },
    checkmark: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primary,
    },
    cancelSeparator: {
      height: tokens.spacing[2],
      backgroundColor: tokens.colors.background,
    },
    cancelOption: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
    },
    cancelText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      textAlign: 'center' as const,
    },
  })
}

// ---------------------------------------------------------------------------
// SortPicker
// ---------------------------------------------------------------------------

/**
 * Sort options bottom sheet. Opens via setValue('__sortPicker_<id>', true).
 * Renders radio-style options with checkmark on selected. Dispatches onSelect
 * and publishes selected value via setValue.
 */
export function SortPicker({ config }: { config: SortPickerConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()

  const isOpen = Boolean(getValue(`__sortPicker_${config.id}`))
  const [selected, setSelected] = useState(config.defaultValue ?? '')
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(300)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const baseTestID = config.testID ?? config.id

  useEffect(() => {
    if (isOpen) {
      opacity.setValue(0)
      translateY.setValue(300)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start()
    }
  }, [isOpen, opacity, translateY])

  const handleClose = useCallback(() => {
    setValue(`__sortPicker_${config.id}`, false)
  }, [config.id, setValue])

  const handleSelect = useCallback(
    async (option: SortOption) => {
      setSelected(option.value)
      if (config.id) {
        setValue(config.id, option.value)
      }
      handleClose()
      await dispatch(config.onSelect)
    },
    [config.id, config.onSelect, setValue, handleClose, dispatch],
  )

  const renderItem = useCallback(
    ({ item }: { item: SortOption }) => {
      const isSelected = item.value === selected
      return (
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          style={styles.optionRow}
          accessibilityRole="radio"
          accessibilityLabel={item.label}
          accessibilityState={{ checked: isSelected }}
          testID={`${baseTestID}-option-${item.value}`}
          activeOpacity={0.7}
        >
          {item.icon != null && (
            <Text style={styles.optionIcon} accessibilityElementsHidden>
              {item.icon}
            </Text>
          )}
          <Text style={isSelected ? styles.optionLabelSelected : styles.optionLabel}>
            {item.label}
          </Text>
          {isSelected && (
            <Text style={styles.checkmark} accessibilityElementsHidden>
              ✓
            </Text>
          )}
        </TouchableOpacity>
      )
    },
    [selected, styles, handleSelect, baseTestID],
  )

  const keyExtractor = useCallback((item: SortOption) => item.value, [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Dismiss">
          <Animated.View style={[styles.backdrop, { opacity }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle} accessibilityRole="header">
                    Sort by
                  </Text>
                </View>
                <View style={styles.divider} />

                <FlatList
                  data={config.options}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />

                <View style={styles.cancelSeparator} />
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.cancelOption}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  testID={`${baseTestID}-cancel`}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    </ComponentWrapper>
  )
}

