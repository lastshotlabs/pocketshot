import type { z } from 'zod'
import type { ConfirmDialogSchema } from './schema'

export type ConfirmDialogConfig = z.infer<typeof ConfirmDialogSchema>
