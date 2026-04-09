import type { z } from 'zod'
import type { ToastSchema } from './schema'

export type ToastConfig = z.infer<typeof ToastSchema>

export interface ToastPayload {
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration: number
  id: number
}
