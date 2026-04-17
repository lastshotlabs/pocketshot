import type { z } from 'zod'
import type { PopoverSchema } from './schema'

export type PopoverConfig = z.input<typeof PopoverSchema>
