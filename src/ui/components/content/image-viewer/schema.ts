import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const ImageViewerSchema = z.object({
  id: z.string().optional(),
  source: z.union([z.string(), FromRefSchema]),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  enableZoom: z.boolean().optional().default(true),
  maxZoom: z.number().optional().default(3),
  showCloseButton: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
