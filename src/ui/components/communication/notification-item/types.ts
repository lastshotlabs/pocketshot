import type { z } from 'zod'
import type { NotificationItemSchema } from './schema'

export type NotificationItemConfig = z.infer<typeof NotificationItemSchema>
