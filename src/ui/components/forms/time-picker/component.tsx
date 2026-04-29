import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TimePickerConfig } from './types'

// ── Time utilities ────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 44

function generateHours(is24Hour: boolean): string[] {
  const count = is24Hour ? 24 : 12
  const start = is24Hour ? 0 : 1
  return Array.from({ length: count }, (_, i) => {
    const h = is24Hour ? i : i + start
    return String(h).padStart(2, '0')
  })
}

function generateMinutes(interval: number): string[] {
  const result: string[] = []
  for (let m = 0; m < 60; m += interval) {
    result.push(String(m).padStart(2, '0'))
  }
  return result
}

function parseTime(timeStr: string): { hour: number; minute: number } | null {
  const parts = timeStr.split(':')
  if (parts.length !== 2) return null
  const hour = parseInt(parts[0], 10)
  const minute = parseInt(parts[1], 10)
  if (isNaN(hour) || isNaN(minute)) return null
  return { hour, minute }
}

function formatTimeDisplay(
  hour: number,
  minute: number,
  is24Hour: boolean,
): string {
  if (is24Hour) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

function formatTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// ── Scroll Column ─────────────────────────────────────────────────────────────

interface ScrollColumnProps {
  items: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  tokens: DesignTokens
  testIDPrefix: string
}

function ScrollColumn({ items, selectedIndex, onSelect, tokens, testIDPrefix }: ScrollColumnProps) {
  const scrollRef = useRef<ScrollView>(null)
  const styles = useMemo(() => makeColumnStyles(tokens), [tokens])

  // Scroll to selected on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      })
    }, 50)
    return () => clearTimeout(timeout)
  }, [selectedIndex])

  const handleMomentumEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = event.nativeEvent.contentOffset.y
      const index = Math.round(y / ITEM_HEIGHT)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index))
      onSelect(clampedIndex)
    },
    [items.length, onSelect],
  )

  return (
    <View style={styles.columnContainer}>
      {/* Selection highlight */}
      <View style={styles.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        nestedScrollEnabled
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex
          return (
            <TouchableOpacity
              key={item}
              style={styles.item}
              onPress={() => {
                onSelect(index)
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                })
              }}
              accessibilityRole="button"
              accessibilityLabel={item}
              accessibilityState={{ selected: isSelected }}
              testID={`${testIDPrefix}-${item}`}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TimePicker({ config }: { config: TimePickerConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const is24Hour = config.is24Hour ?? false
  const minuteInterval = config.minuteInterval ?? 1

  const resolvedDefault =
    config.defaultValue != null
      ? resolveFromRef<string>(config.defaultValue, values)
      : undefined
  const resolvedLabel =
    config.label != null ? resolveFromRef<string>(config.label, values) : undefined
  const resolvedPlaceholder =
    config.placeholder != null
      ? resolveFromRef<string>(config.placeholder, values)
      : undefined

  const parsedDefault = resolvedDefault ? parseTime(resolvedDefault) : null

  const [selectedHour, setSelectedHour] = useState(parsedDefault?.hour ?? (is24Hour ? 0 : 12))
  const [selectedMinute, setSelectedMinute] = useState(parsedDefault?.minute ?? 0)
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => {
    if (parsedDefault) return parsedDefault.hour >= 12 ? 'PM' : 'AM'
    return 'AM'
  })
  const [pickerVisible, setPickerVisible] = useState(false)
  const [hasValue, setHasValue] = useState(parsedDefault != null)

  const hours = useMemo(() => generateHours(is24Hour), [is24Hour])
  const minutes = useMemo(() => generateMinutes(minuteInterval), [minuteInterval])

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Compute actual 24h hour from display hour + period
  const actual24Hour = useMemo(() => {
    if (is24Hour) return selectedHour
    if (period === 'AM') return selectedHour === 12 ? 0 : selectedHour
    return selectedHour === 12 ? 12 : selectedHour + 12
  }, [is24Hour, selectedHour, period])

  // Publish value
  useEffect(() => {
    if (hasValue) {
      setValue(config.id, formatTimeValue(actual24Hour, selectedMinute))
    }
  }, [config.id, actual24Hour, selectedMinute, hasValue, setValue])

  const handleConfirm = useCallback(() => {
    setHasValue(true)
    setPickerVisible(false)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }, [config.onChangeAction, dispatch])

  const hourIndex = useMemo(() => {
    if (is24Hour) return selectedHour
    return selectedHour - 1
  }, [is24Hour, selectedHour])

  const minuteIndex = useMemo(() => {
    return Math.round(selectedMinute / minuteInterval)
  }, [selectedMinute, minuteInterval])

  const displayText = hasValue
    ? formatTimeDisplay(actual24Hour, selectedMinute, is24Hour)
    : resolvedPlaceholder

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {resolvedLabel}
          </Text>
        )}

        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={resolvedLabel ?? 'Time picker'}
          accessibilityHint="Opens a time picker"
          testID={config.testID ?? config.id}
        >
          <Text
            style={[styles.triggerText, !hasValue && styles.triggerPlaceholder]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          <Text style={styles.clockIcon}>{'\u{1F552}'}</Text>
        </TouchableOpacity>

        <Modal
          visible={pickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerVisible(false)}
          accessibilityViewIsModal
        >
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setPickerVisible(false)}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close time picker"
          >
            <SafeAreaView style={styles.pickerPanel}>
              <TouchableOpacity activeOpacity={1}>
                <Text style={styles.pickerTitle}>
                  {resolvedLabel ?? 'Select Time'}
                </Text>

                <View style={styles.columnsRow}>
                  {/* Hours column */}
                  <ScrollColumn
                    items={hours}
                    selectedIndex={hourIndex}
                    onSelect={(index) => {
                      const h = is24Hour ? index : index + 1
                      setSelectedHour(h)
                    }}
                    tokens={tokens}
                    testIDPrefix={`${config.id}-hour`}
                  />

                  <Text style={styles.separator}>:</Text>

                  {/* Minutes column */}
                  <ScrollColumn
                    items={minutes}
                    selectedIndex={minuteIndex}
                    onSelect={(index) => {
                      setSelectedMinute(index * minuteInterval)
                    }}
                    tokens={tokens}
                    testIDPrefix={`${config.id}-minute`}
                  />

                  {/* AM/PM toggle */}
                  {!is24Hour && (
                    <View style={styles.periodColumn}>
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          period === 'AM' && styles.periodButtonActive,
                        ]}
                        onPress={() => setPeriod('AM')}
                        accessibilityRole="button"
                        accessibilityLabel="AM"
                        accessibilityState={{ selected: period === 'AM' }}
                        testID={`${config.id}-am`}
                      >
                        <Text
                          style={[
                            styles.periodText,
                            period === 'AM' && styles.periodTextActive,
                          ]}
                        >
                          AM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          period === 'PM' && styles.periodButtonActive,
                        ]}
                        onPress={() => setPeriod('PM')}
                        accessibilityRole="button"
                        accessibilityLabel="PM"
                        accessibilityState={{ selected: period === 'PM' }}
                        testID={`${config.id}-pm`}
                      >
                        <Text
                          style={[
                            styles.periodText,
                            period === 'PM' && styles.periodTextActive,
                          ]}
                        >
                          PM
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Confirm button */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm time"
                    testID={`${config.id}-confirm`}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>
      </View>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      minHeight: 48,
    },
    triggerText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    triggerPlaceholder: {
      color: tokens.colors.inputPlaceholder,
    },
    clockIcon: {
      fontSize: tokens.typography.fontSizeMd,
      marginLeft: tokens.spacing[2],
    },
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pickerPanel: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.xl,
      marginHorizontal: tokens.spacing[4],
      width: Dimensions.get('window').width - tokens.spacing[8] * 2,
      ...tokens.shadows.lg,
      ...Platform.select({
        android: { elevation: 8 },
      }),
    },
    pickerTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      textAlign: 'center',
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[3],
    },
    columnsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.spacing[4],
      gap: tokens.spacing[2],
    },
    separator: {
      fontSize: tokens.typography.fontSizeXl,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.text,
    },
    periodColumn: {
      gap: tokens.spacing[2],
      marginLeft: tokens.spacing[3],
    },
    periodButton: {
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: tokens.colors.primary,
      borderColor: tokens.colors.primary,
    },
    periodText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    periodTextActive: {
      color: tokens.colors.primaryForeground,
    },
    footer: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      borderTopWidth: 1,
      borderTopColor: tokens.colors.divider,
      marginTop: tokens.spacing[3],
    },
    confirmButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[3],
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
  })
}

function makeColumnStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    columnContainer: {
      height: ITEM_HEIGHT * 5,
      width: 64,
      position: 'relative',
    },
    highlight: {
      position: 'absolute',
      top: ITEM_HEIGHT * 2,
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.md,
    },
    scrollView: {
      flex: 1,
    },
    item: {
      height: ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemText: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.textMuted,
    },
    itemTextSelected: {
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
    },
  })
}

