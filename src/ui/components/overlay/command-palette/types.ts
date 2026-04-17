import type { z } from 'zod'
import type { CommandPaletteSchema } from './schema'

export type CommandPaletteConfig = z.input<typeof CommandPaletteSchema>
