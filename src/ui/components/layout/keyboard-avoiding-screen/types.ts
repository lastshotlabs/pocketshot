import type { z } from 'zod'
import type { KeyboardAvoidingScreenSchema } from './schema'

export type KeyboardAvoidingScreenConfig = z.input<typeof KeyboardAvoidingScreenSchema>
