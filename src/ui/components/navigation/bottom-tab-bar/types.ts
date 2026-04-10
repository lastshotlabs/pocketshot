import type { z } from 'zod'
import type { BottomTabBarSchema } from './schema'

export type BottomTabBarConfig = z.input<typeof BottomTabBarSchema>
