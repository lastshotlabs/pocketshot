import type { z } from 'zod'
import type { AvatarGroupSchema } from './schema'

export type AvatarGroupConfig = z.infer<typeof AvatarGroupSchema>
export type AvatarGroupItem = { src?: string; name?: string }
