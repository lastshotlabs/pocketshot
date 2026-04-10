import type { z } from 'zod'
import type { TopBarSchema } from './schema'

export type TopBarConfig = z.input<typeof TopBarSchema>
