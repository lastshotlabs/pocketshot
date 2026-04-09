import type { z } from 'zod'
import type { ToastSchema } from './schema'

export type ToastConfig = z.input<typeof ToastSchema>

export interface ToastPayload {
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration: number
  id: number
}
