import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const ImageViewerSchema = extendComponentSchema({
  source: z.union([z.string(), FromRefSchema]),
  alt: z.string().optional(),
  enableZoom: z.boolean().optional().default(true),
  maxZoom: z.number().optional().default(3),
  showCloseButton: z.boolean().optional().default(true),
})
