import type { z } from 'zod'
import type { DrawerMenuSchema } from './schema'

export type DrawerMenuConfig = z.input<typeof DrawerMenuSchema>
