import type { z } from 'zod'
import type { PasswordInputSchema } from './schema'

export type PasswordInputConfig = z.input<typeof PasswordInputSchema>
