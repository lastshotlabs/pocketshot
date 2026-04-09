import type { z } from 'zod'
import type { SwitchSchema } from './schema'

export type SwitchConfig = z.input<typeof SwitchSchema>
