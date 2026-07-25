import type { z } from 'zod'
import type { QrCodeSchema } from './schema'

export type QrCodeConfig = z.input<typeof QrCodeSchema>
