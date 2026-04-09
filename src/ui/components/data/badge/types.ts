import type { z } from 'zod'
import type { BadgeSchema } from './schema'

export type BadgeConfig = z.input<typeof BadgeSchema>
