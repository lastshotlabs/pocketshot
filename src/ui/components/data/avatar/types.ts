import type { z } from 'zod'
import type { AvatarSchema } from './schema'

export type AvatarConfig = z.input<typeof AvatarSchema>
