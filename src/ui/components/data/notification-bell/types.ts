import type { z } from 'zod'
import type { NotificationBellSchema } from './schema'

export type NotificationBellConfig = z.input<typeof NotificationBellSchema>
