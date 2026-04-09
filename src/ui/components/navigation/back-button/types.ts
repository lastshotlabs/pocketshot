import type { z } from 'zod'
import type { BackButtonSchema } from './schema'

export type BackButtonConfig = z.input<typeof BackButtonSchema>
