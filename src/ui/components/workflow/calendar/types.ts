import type { z } from 'zod'
import type { CalendarSchema } from './schema'

export type CalendarConfig = z.infer<typeof CalendarSchema>

export interface CalendarEvent {
  date: string
  title: string
  color?: string
}

export interface CalendarDay {
  date: Date
  dateStr: string // YYYY-MM-DD
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: CalendarEvent[]
}
