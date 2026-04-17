import type { z } from 'zod'
import type { AccordionSchema } from './schema'

export type AccordionConfig = z.input<typeof AccordionSchema>
