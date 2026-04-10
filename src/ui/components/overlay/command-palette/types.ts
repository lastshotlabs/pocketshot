import type { z } from 'zod'
import type { CommandPaletteSchema } from './schema'

export type CommandPaletteConfig = z.infer<typeof CommandPaletteSchema>
