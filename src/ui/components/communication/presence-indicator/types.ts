import type { z } from 'zod'
import type { PresenceIndicatorSchema } from './schema'

export type PresenceIndicatorConfig = z.input<typeof PresenceIndicatorSchema>

export type PresenceStatus = 'online' | 'offline' | 'away' | 'busy' | 'idle'
export type PresenceSize = 'xs' | 'sm' | 'md' | 'lg'
