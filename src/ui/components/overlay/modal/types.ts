import type { z } from 'zod'
import type { ModalSchema } from './schema'

export type ModalConfig = z.infer<typeof ModalSchema>
