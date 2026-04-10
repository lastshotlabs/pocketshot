import type { z } from 'zod'
import type { ButtonSchema } from './schema'

export type ButtonConfig = z.input<typeof ButtonSchema>
