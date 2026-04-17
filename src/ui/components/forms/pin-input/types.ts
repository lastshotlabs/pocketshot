import type { z } from 'zod'
import type { PinInputSchema } from './schema'

export type PinInputConfig = z.input<typeof PinInputSchema>
