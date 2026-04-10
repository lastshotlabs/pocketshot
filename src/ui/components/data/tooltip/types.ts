import type { z } from 'zod'
import type { TooltipSchema } from './schema'

export type TooltipConfig = z.input<typeof TooltipSchema>
