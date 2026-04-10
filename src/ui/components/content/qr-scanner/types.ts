import type { z } from 'zod'
import type { QrScannerSchema } from './schema'

export type QrScannerConfig = z.infer<typeof QrScannerSchema>
