import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
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
const EVENT_DOT_SIZE = 4
const MAX_EVENT_DOTS = 3

export interface CalendarBaseEvent {
  date: string // YYYY-MM-DD
  title: string
  color?: string
}

export interface CalendarBaseDay {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: CalendarBaseEvent[]
}

export interface CalendarBaseProps {
  /** Currently selected date (controlled). YYYY-MM-DD. */
  selectedDate?: string | null
  /** Default date for uncontrolled use. */
  defaultDate?: string | null
  /** Called when a day is pressed. Receives the YYYY-MM-DD string. */
  onDateChange?: (dateStr: string) => void
  /** Events to show as dots under the day. */
  events?: CalendarBaseEvent[]
  /** Show next/prev month navigation. Default true. */
  showNavigation?: boolean
  style?: ViewStyle
  testID?: string
  id?: string
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getMonthDays(
  year: number,
  month: number,
  selectedDate: string | null,
  today: Date,
  events: CalendarBaseEvent[],
): CalendarBaseDay[] {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()

  const days: CalendarBaseDay[] = []
  for (let i = 0; i < 42; i++) {
    const dayOffset = i - startOffset
    const date = new Date(year, month, 1 + dayOffset)
    const dateStr = formatDateStr(date)
    const isCurrentMonth = date.getMonth() === month
    const isToday = isSameDay(date, today)
    const isSelected = selectedDate === dateStr
    const dayEvents = events.filter((e) => e.date === dateStr)

    days.push({ date, dateStr, isCurrentMonth, isToday, isSelected, events: dayEvents })
  }
  return days
}

/**
 * Standalone Calendar — plain React props, no manifest required.
 *
 * @example
 * <CalendarBase selectedDate="2024-06-15" onDateChange={(d) => setDate(d)} />
 */
export function CalendarBase({
  selectedDate: controlledSelected,
  defaultDate,
  onDateChange,
  events,
  showNavigation = true,
  style,
  testID,
  id,
}: CalendarBaseProps) {
  const tokens = useTokens()
  const fadeAnim = useRef(new Animated.Value(1)).current

  const isControlled = controlledSelected !== undefined
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultDate ?? null)
  const selectedDate = isControlled ? (controlledSelected ?? null) : uncontrolled

  const today = useMemo(() => new Date(), [])
  const initialDate = useMemo(() => {
    const src = selectedDate ?? defaultDate ?? null
    if (src) {
      const d = new Date(src)
      if (!isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() }
    }
    return { year: today.getFullYear(), month: today.getMonth() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [displayMonth, setDisplayMonth] = useState(initialDate)
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const resolvedEvents = events ?? []

  const days = useMemo(
    () => getMonthDays(displayMonth.year, displayMonth.month, selectedDate, today, resolvedEvents),
    [displayMonth.year, displayMonth.month, selectedDate, today, resolvedEvents],
  )

  const animateTransition = useCallback(
    (fn: () => void) => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start()
      fn()
    },
    [fadeAnim],
  )

  const handlePrevMonth = useCallback(() => {
    animateTransition(() => {
      setDisplayMonth((prev) =>
        prev.month === 0
          ? { year: prev.year - 1, month: 11 }
          : { year: prev.year, month: prev.month - 1 },
      )
    })
  }, [animateTransition])

  const handleNextMonth = useCallback(() => {
    animateTransition(() => {
      setDisplayMonth((prev) =>
        prev.month === 11
          ? { year: prev.year + 1, month: 0 }
          : { year: prev.year, month: prev.month + 1 },
      )
    })
  }, [animateTransition])

  const handleDayPress = useCallback(
    (day: CalendarBaseDay) => {
      if (!isControlled) setUncontrolled(day.dateStr)
      onDateChange?.(day.dateStr)
    },
    [isControlled, onDateChange],
  )

  const monthLabel = `${MONTH_NAMES[displayMonth.month]} ${displayMonth.year}`

  return (
    <View style={[styles.container, style]} testID={testID ?? id}>
      {showNavigation ? (
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            style={styles.navButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            testID={testID ? `${testID}-prev-month` : undefined}
          >
            <Text style={styles.navChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel} accessibilityRole="header">
            {monthLabel}
          </Text>
          <TouchableOpacity
            onPress={handleNextMonth}
            style={styles.navButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            testID={testID ? `${testID}-next-month` : undefined}
          >
            <Text style={styles.navChevron}>›</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {Array.from({ length: 6 }).map((_, rowIdx) => (
          <View key={rowIdx} style={styles.weekRow}>
            {Array.from({ length: 7 }).map((_, colIdx) => {
              const day = days[rowIdx * 7 + colIdx]
              return (
                <DayCell
                  key={day.dateStr}
                  day={day}
                  tokens={tokens}
                  styles={styles}
                  onPress={handleDayPress}
                  testIDPrefix={testID}
                />
              )
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  )
}

interface DayCellProps {
  day: CalendarBaseDay
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onPress: (day: CalendarBaseDay) => void
  testIDPrefix?: string
}

function DayCell({ day, tokens, styles, onPress, testIDPrefix }: DayCellProps) {
  const handlePress = useCallback(() => onPress(day), [onPress, day])
  const dots = day.events.slice(0, MAX_EVENT_DOTS)

  return (
    <TouchableOpacity
      style={styles.dayCell}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${day.dateStr}${day.isToday ? ', today' : ''}${day.isSelected ? ', selected' : ''}${day.events.length > 0 ? `, ${day.events.length} event${day.events.length > 1 ? 's' : ''}` : ''}`}
      testID={testIDPrefix ? `${testIDPrefix}-day-${day.dateStr}` : undefined}
    >
      <View
        style={[
          styles.dayInner,
          day.isToday && styles.dayToday,
          day.isSelected && !day.isToday && styles.daySelected,
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            !day.isCurrentMonth && styles.dayOutsideMonth,
            day.isToday && styles.dayTodayText,
            day.isSelected && !day.isToday && styles.daySelectedText,
          ]}
        >
          {day.date.getDate()}
        </Text>
      </View>
      {dots.length > 0 ? (
        <View style={styles.dotsRow}>
          {dots.map((evt, i) => (
            <View
              key={i}
              style={[styles.eventDot, { backgroundColor: evt.color ?? tokens.colors.primary }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

function makeStyles(tokens: DesignTokens) {
  const CELL_SIZE = 40

  return StyleSheet.create({
    container: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[3],
      ...tokens.shadows.sm,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: tokens.spacing[3],
    },
    navButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.md,
    },
    navChevron: {
      fontSize: tokens.typography.fontSizeXl,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
      lineHeight: 28,
    },
    monthLabel: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: tokens.spacing[1],
    },
    weekdayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: tokens.spacing[1],
    },
    weekdayLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    weekRow: {
      flexDirection: 'row',
    },
    dayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: tokens.spacing[1],
    },
    dayInner: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: CELL_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayToday: {
      backgroundColor: tokens.colors.primary,
    },
    daySelected: {
      borderWidth: 2,
      borderColor: tokens.colors.primary,
    },
    dayNumber: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    dayOutsideMonth: {
      opacity: 0.35,
    },
    dayTodayText: {
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightBold,
    },
    daySelectedText: {
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    dotsRow: {
      flexDirection: 'row',
      gap: 2,
      marginTop: 2,
      height: EVENT_DOT_SIZE,
    },
    eventDot: {
      width: EVENT_DOT_SIZE,
      height: EVENT_DOT_SIZE,
      borderRadius: EVENT_DOT_SIZE / 2,
    },
  })
}
