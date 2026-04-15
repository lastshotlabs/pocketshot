import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const QrCodeSchema = extendComponentSchema({
  id: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]),
  size: z.number().positive().optional().default(200),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  logo: z.string().optional(),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  testID: z.string().optional(),
})
