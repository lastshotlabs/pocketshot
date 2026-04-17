import type { z } from 'zod'
import type { DropdownMenuSchema } from './schema'

export type DropdownMenuConfig = z.input<typeof DropdownMenuSchema>
