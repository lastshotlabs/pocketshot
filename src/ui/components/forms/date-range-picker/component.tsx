import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { DateRangePickerConfig } from './types'

// ── Date utilities ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function toISODate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
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

function isDateBetween(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

function getTodayISO(): string {
  const now = new Date()
  return toISODate(now.getFullYear(), now.getMonth(), now.getDate())
}

// ── Range Month Grid ──────────────────────────────────────────────────────────

type SelectionPhase = 'start' | 'end'

interface RangeMonthGridProps {
  year: number
  month: number
  rangeStart: string | null
  rangeEnd: string | null
  hoverDate: string | null
  selectionPhase: SelectionPhase
  today: string
  minDate?: string
  maxDate?: string
  tokens: DesignTokens
  onSelectDay: (dateStr: string) => void
  testIDPrefix: string
}

function RangeMonthGrid({
  year,
  month,
  rangeStart,
  rangeEnd,
  hoverDate,
  selectionPhase,
  today,
  minDate,
  maxDate,
  tokens,
  onSelectDay,
  testIDPrefix,
}: RangeMonthGridProps) {
  const styles = useMemo(() => makeGridStyles(tokens), [tokens])
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const cells: Array<{ day: number; dateStr: string } | null> = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: toISODate(year, month, d) })
  }

  const rows: Array<typeof cells> = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }

  // Determine visual range for highlighting
  const effectiveEnd = rangeEnd ?? hoverDate
  const showRange = rangeStart != null && effectiveEnd != null

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
            const inRange = isDateInRange(cell.dateStr, minDate, maxDate)
            const isStart = rangeStart != null && cell.dateStr === rangeStart
            const isEnd = (rangeEnd != null && cell.dateStr === rangeEnd) ||
              (rangeEnd == null && hoverDate != null && cell.dateStr === hoverDate)
            const isBetween =
              showRange &&
              !isStart &&
              !isEnd &&
              isDateBetween(
                cell.dateStr,
                rangeStart! < effectiveEnd! ? rangeStart! : effectiveEnd!,
                rangeStart! < effectiveEnd! ? effectiveEnd! : rangeStart!,
              )
            const isToday = cell.dateStr === today

            return (
              <TouchableOpacity
                key={cell.day}
                style={[
                  styles.dayCell,
                  isBetween && styles.dayCellInRange,
                  (isStart || isEnd) && styles.dayCellEndpoint,
                  isToday && !isStart && !isEnd && styles.dayCellToday,
                  !inRange && styles.dayCellDisabled,
                ]}
                onPress={() => {
                  if (inRange) onSelectDay(cell.dateStr)
                }}
                disabled={!inRange}
                accessibilityRole="button"
                accessibilityLabel={`${MONTH_NAMES[month]} ${cell.day}, ${year}`}
                accessibilityState={{
                  selected: isStart || isEnd,
                  disabled: !inRange,
                }}
                testID={`${testIDPrefix}-day-${cell.dateStr}`}
              >
                <Text
                  style={[
                    styles.dayText,
                    isBetween && styles.dayTextInRange,
                    (isStart || isEnd) && styles.dayTextEndpoint,
                    isToday && !isStart && !isEnd && styles.dayTextToday,
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

// ── Main Component ────────────────────────────────────────────────────────────

export function DateRangePicker({ config }: { config: DateRangePickerConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedStart =
    config.defaultStart != null
      ? resolveFromRef<string>(config.defaultStart, values)
      : undefined
  const resolvedEnd =
    config.defaultEnd != null
      ? resolveFromRef<string>(config.defaultEnd, values)
      : undefined

  const [rangeStart, setRangeStart] = useState<string | null>(resolvedStart ?? null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(resolvedEnd ?? null)
  const [selectionPhase, setSelectionPhase] = useState<SelectionPhase>(
    resolvedStart && resolvedEnd ? 'start' : 'start',
  )
  const [pickerVisible, setPickerVisible] = useState(false)

  const today = useMemo(() => getTodayISO(), [])

  const [viewYear, setViewYear] = useState(() => {
    if (resolvedStart) {
      const parsed = parseISO(resolvedStart)
      if (parsed) return parsed.year
    }
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (resolvedStart) {
      const parsed = parseISO(resolvedStart)
      if (parsed) return parsed.month
    }
    return new Date().getMonth()
  })

  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const format = config.format ?? 'MM/DD/YYYY'

  // Publish values
  useEffect(() => {
    setValue(config.id, {
      start: rangeStart ?? '',
      end: rangeEnd ?? '',
    })
  }, [config.id, rangeStart, rangeEnd, setValue])

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
      if (selectionPhase === 'start') {
        setRangeStart(dateStr)
        setRangeEnd(null)
        setSelectionPhase('end')
      } else {
        // If the selected end is before start, swap
        if (rangeStart && dateStr < rangeStart) {
          setRangeEnd(rangeStart)
          setRangeStart(dateStr)
        } else {
          setRangeEnd(dateStr)
        }
        setSelectionPhase('start')
        setPickerVisible(false)
        if (config.onChangeAction) {
          void dispatch(config.onChangeAction)
        }
      }
    },
    [selectionPhase, rangeStart, config.onChangeAction, dispatch],
  )

  const handleOpen = useCallback(() => {
    if (rangeStart) {
      const parsed = parseISO(rangeStart)
      if (parsed) {
        setViewYear(parsed.year)
        setViewMonth(parsed.month)
      }
    }
    setSelectionPhase('start')
    setPickerVisible(true)
  }, [rangeStart])

  const startDisplay = rangeStart ? formatDate(rangeStart, format) : config.startPlaceholder
  const endDisplay = rangeEnd ? formatDate(rangeEnd, format) : config.endPlaceholder

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}

        <TouchableOpacity
          style={styles.trigger}
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel={config.label ?? 'Date range picker'}
          accessibilityHint="Opens a date range picker"
          testID={config.testID ?? config.id}
        >
          <View style={styles.dateDisplay}>
            <Text
              style={[styles.dateText, !rangeStart && styles.datePlaceholder]}
              numberOfLines={1}
            >
              {startDisplay}
            </Text>
          </View>
          <Text style={styles.arrow}>{'\u2192'}</Text>
          <View style={styles.dateDisplay}>
            <Text
              style={[styles.dateText, !rangeEnd && styles.datePlaceholder]}
              numberOfLines={1}
            >
              {endDisplay}
            </Text>
          </View>
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
            accessibilityLabel="Close date range picker"
          >
            <SafeAreaView style={styles.pickerPanel}>
              <TouchableOpacity activeOpacity={1}>
                {/* Phase indicator */}
                <Text style={styles.phaseText}>
                  {selectionPhase === 'start'
                    ? 'Select start date'
                    : 'Select end date'}
                </Text>

                {/* Month/Year navigation */}
                <View style={styles.navRow}>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={styles.navButton}
                    accessibilityRole="button"
                    accessibilityLabel="Previous month"
                    testID={`${config.id}-prev-month`}
                  >
                    <Text style={styles.navArrow}>{'\u25C0'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.navTitle}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                  <TouchableOpacity
                    onPress={handleNextMonth}
                    style={styles.navButton}
                    accessibilityRole="button"
                    accessibilityLabel="Next month"
                    testID={`${config.id}-next-month`}
                  >
                    <Text style={styles.navArrow}>{'\u25B6'}</Text>
                  </TouchableOpacity>
                </View>

                <RangeMonthGrid
                  year={viewYear}
                  month={viewMonth}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  hoverDate={null}
                  selectionPhase={selectionPhase}
                  today={today}
                  minDate={config.minDate}
                  maxDate={config.maxDate}
                  tokens={tokens}
                  onSelectDay={handleSelectDay}
                  testIDPrefix={config.id}
                />

                {/* Selected range summary */}
                {rangeStart != null && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>
                      {rangeStart ? formatDate(rangeStart, format) : '---'}
                      {' \u2192 '}
                      {rangeEnd ? formatDate(rangeEnd, format) : '---'}
                    </Text>
                  </View>
                )}
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
      gap: tokens.spacing[2],
    },
    dateDisplay: {
      flex: 1,
    },
    dateText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      textAlign: 'center',
    },
    datePlaceholder: {
      color: tokens.colors.inputPlaceholder,
    },
    arrow: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
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
      ...tokens.shadows.lg,
      ...Platform.select({
        android: { elevation: 8 },
      }),
    },
    phaseText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
      textAlign: 'center',
      paddingTop: tokens.spacing[4],
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[2],
      paddingBottom: tokens.spacing[3],
    },
    navButton: {
      padding: tokens.spacing[2],
    },
    navArrow: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
    },
    navTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    summaryRow: {
      alignItems: 'center',
      paddingVertical: tokens.spacing[3],
      borderTopWidth: 1,
      borderTopColor: tokens.colors.divider,
    },
    summaryText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
  })
}

function makeGridStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    grid: {
      paddingHorizontal: tokens.spacing[3],
      paddingBottom: tokens.spacing[2],
    },
    dayLabelsRow: {
      flexDirection: 'row',
      marginBottom: tokens.spacing[1],
    },
    dayLabelCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: tokens.spacing[1],
    },
    dayLabelText: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.textMuted,
    },
    dayRow: {
      flexDirection: 'row',
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 1,
    },
    dayCellToday: {
      borderWidth: 1,
      borderColor: tokens.colors.primary,
      borderRadius: tokens.radius.full,
    },
    dayCellEndpoint: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.full,
    },
    dayCellInRange: {
      backgroundColor: tokens.colors.primary + '20',
    },
    dayCellDisabled: {
      opacity: 0.3,
    },
    dayText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
    },
    dayTextToday: {
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.primary,
    },
    dayTextEndpoint: {
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    dayTextInRange: {
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    dayTextDisabled: {
      color: tokens.colors.textMuted,
    },
  })
}
