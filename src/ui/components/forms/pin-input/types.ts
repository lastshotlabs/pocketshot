import type { z } from 'zod'
import type { PinInputSchema } from './schema'

export type PinInputConfig = z.infer<typeof PinInputSchema>
