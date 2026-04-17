import type { z } from 'zod'
import type { QrScannerSchema } from './schema'

export type QrScannerConfig = z.input<typeof QrScannerSchema>
