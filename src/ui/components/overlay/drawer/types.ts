import type { z } from 'zod'
import type { DrawerSchema } from './schema'

export type DrawerConfig = z.input<typeof DrawerSchema>
