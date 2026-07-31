import React, { useCallback, useMemo, useState } from 'react'
import {
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseISO(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  return { year, month, day }
}

function formatDate(dateStr: string, format: string): string {
  const parsed = parseISO(dateStr)
  if (!parsed) return dateStr
  const { year, month, day } = parsed
  return format
    .replace('YYYY', String(year))
    .replace('MM', String(month + 1).padStart(2, '0'))
    .replace('DD', String(day).padStart(2, '0'))
}

function isDateInRange(dateStr: string, minDate?: string, maxDate?: string): boolean {
  if (minDate && dateStr < minDate) return false
  if (maxDate && dateStr > maxDate) return false
  return true
}

function getTodayISO(): string {
  const now = new Date()
  return toISODate(now.getFullYear(), now.getMonth(), now.getDate())
}

interface MonthGridProps {
  year: number
  month: number
  selectedDate: string | null
  today: string
  minDate?: string
  maxDate?: string
  tokens: DesignTokens
  onSelectDay: (dateStr: string) => void
  testIDPrefix: string
}

function MonthGrid({
  year,
  month,
  selectedDate,
  today,
  minDate,
  maxDate,
  tokens,
  onSelectDay,
  testIDPrefix,
}: MonthGridProps) {
  const styles = useMemo(() => makeGridStyles(tokens), [tokens])
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const cells: Array<{ day: number; dateStr: string } | null> = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: toISODate(year, month, d) })
  }

  const rows: Array<typeof cells> = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  return (
    <View style={styles.grid}>
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.dayLabelCell}>
            <Text style={styles.dayLabelText}>{label}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.dayRow}>
          {row.map((cell, cellIdx) => {
            if (!cell) {
              return <View key={`empty-${cellIdx}`} style={styles.dayCell} />
            }
            const isSelected = selectedDate != null && cell.dateStr === selectedDate
            const isToday = cell.dateStr === today
            const inRange = isDateInRange(cell.dateStr, minDate, maxDate)

            return (
              <TouchableOpacity
                key={cell.day}
                style={[
                  styles.dayCell,
                  isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                  !inRange && styles.dayCellDisabled,
                ]}
                onPress={() => {
                  if (inRange) onSelectDay(cell.dateStr)
                }}
                disabled={!inRange}
                accessibilityRole="button"
                accessibilityLabel={`${MONTH_NAMES[month]} ${cell.day}, ${year}`}
                accessibilityState={{ selected: isSelected, disabled: !inRange }}
                testID={`${testIDPrefix}-day-${cell.dateStr}`}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                    !inRange && styles.dayTextDisabled,
                  ]}
                >
                  {cell.day}
                </Text>
              </TouchableOpacity>
            )
          })}
          {row.length < 7 &&
            Array.from({ length: 7 - row.length }).map((_, i) => (
              <View key={`trail-${i}`} style={styles.dayCell} />
            ))}
        </View>
      ))}
    </View>
  )
}

export interface DatePickerBaseProps {
  /** Controlled ISO date (YYYY-MM-DD). */
  value?: string
  /** Initial ISO date when uncontrolled. */
  defaultValue?: string
  /** Called when the user picks a date. */
  onChange?: (value: string) => void
  /** Visible label. */
  label?: string
  /** Trigger placeholder when empty. */
  placeholder?: string
  /** Display format for the trigger. */
  format?: string
  /** Min selectable ISO date (inclusive). */
  minDate?: string
  /** Max selectable ISO date (inclusive). */
  maxDate?: string
  /** Style applied to root. */
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone DatePicker — modal calendar date picker.
 *
 * @example
 * <DatePickerBase label="Birthday" value={dob} onChange={setDob} />
 */
export function DatePickerBase({
  value,
  defaultValue,
  onChange,
  label,
  placeholder,
  format = 'MM/DD/YYYY',
  minDate,
  maxDate,
  style,
  testID,
  id,
}: DatePickerBaseProps) {
  const tokens = useTokens()
  const [internal, setInternal] = useState<string | null>(defaultValue ?? null)
  const isControlled = value !== undefined
  const selectedDate = isControlled ? (value ?? null) : internal

  const [pickerVisible, setPickerVisible] = useState(false)
  const today = useMemo(() => getTodayISO(), [])
  const initial = useMemo(() => {
    if (selectedDate) return parseISO(selectedDate)
    return { year: new Date().getFullYear(), month: new Date().getMonth(), day: 1 }
  }, [selectedDate])

  const [viewYear, setViewYear] = useState(initial?.year ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(initial?.month ?? new Date().getMonth())
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
  }, [])

  const handleSelectDay = useCallback(
    (dateStr: string) => {
      if (!isControlled) setInternal(dateStr)
      setPickerVisible(false)
      onChange?.(dateStr)
    },
    [isControlled, onChange],
  )

  const handleOpen = useCallback(() => {
    if (selectedDate) {
      const parsed = parseISO(selectedDate)
      if (parsed) {
        setViewYear(parsed.year)
        setViewMonth(parsed.month)
      }
    }
    setPickerVisible(true)
  }, [selectedDate])

  const displayText = selectedDate ? formatDate(selectedDate, format) : placeholder
  const testIDBase = testID ?? id

  return (
    <View style={[styles.container, style]}>
      {label != null ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.trigger}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Date picker'}
        accessibilityHint="Opens a date picker"
        testID={testIDBase}
      >
        <Text
          style={[styles.triggerText, !selectedDate && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Text style={styles.calendarIcon}>📅</Text>
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
          accessibilityLabel="Close date picker"
        >
          <SafeAreaView style={styles.pickerPanel}>
            <TouchableOpacity activeOpacity={1} accessible={false}>
              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.navButton}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  testID={testIDBase ? `${testIDBase}-prev-month` : undefined}
                >
                  <Text style={styles.navArrow}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.navTitle}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.navButton}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  testID={testIDBase ? `${testIDBase}-next-month` : undefined}
                >
                  <Text style={styles.navArrow}>▶</Text>
                </TouchableOpacity>
              </View>

              <MonthGrid
                year={viewYear}
                month={viewMonth}
                selectedDate={selectedDate}
                today={today}
                minDate={minDate}
                maxDate={maxDate}
                tokens={tokens}
                onSelectDay={handleSelectDay}
                testIDPrefix={testIDBase ?? 'date-picker'}
              />

              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => {
                    const todayParsed = parseISO(today)
                    if (todayParsed) {
                      setViewYear(todayParsed.year)
                      setViewMonth(todayParsed.month)
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Go to today"
                  testID={testIDBase ? `${testIDBase}-today` : undefined}
                >
                  <Text style={styles.todayLink}>Today</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: { gap: tokens.spacing[1] },
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
    triggerPlaceholder: { color: tokens.colors.inputPlaceholder },
    calendarIcon: { fontSize: tokens.typography.fontSizeMd, marginLeft: tokens.spacing[2] },
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
      ...tokens.shadows.lg,
      ...Platform.select({ android: { elevation: 8 } }),
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[3],
    },
    navButton: { padding: tokens.spacing[2] },
    navArrow: { fontSize: tokens.typography.fontSizeSm, color: tokens.colors.text },
    navTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: tokens.spacing[3],
      borderTopWidth: 1,
      borderTopColor: tokens.colors.divider,
    },
    todayLink: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
    },
  })
}

function makeGridStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    grid: { paddingHorizontal: tokens.spacing[3], paddingBottom: tokens.spacing[2] },
    dayLabelsRow: { flexDirection: 'row', marginBottom: tokens.spacing[1] },
    dayLabelCell: { flex: 1, alignItems: 'center', paddingVertical: tokens.spacing[1] },
    dayLabelText: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.textMuted,
    },
    dayRow: { flexDirection: 'row' },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.full,
      margin: 1,
    },
    dayCellToday: { borderWidth: 1, borderColor: tokens.colors.primary },
    dayCellSelected: { backgroundColor: tokens.colors.primary },
    dayCellDisabled: { opacity: 0.3 },
    dayText: { fontSize: tokens.typography.fontSizeSm, color: tokens.colors.text },
    dayTextToday: {
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.primary,
    },
    dayTextSelected: {
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    dayTextDisabled: { color: tokens.colors.textMuted },
  })
}
