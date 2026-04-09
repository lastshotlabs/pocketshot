import type { z } from 'zod'
import type { ActivityFeedSchema } from './schema'

export type ActivityFeedConfig = z.input<typeof ActivityFeedSchema>

export interface ActivityFeedItem {
  id: string
  actorName?: string
  actorAvatar?: string
  action?: string
  target?: string
  timestamp?: string
}
