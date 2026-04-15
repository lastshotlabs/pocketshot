import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'

export const ModalSchema = extendComponentSchema({
  id: z.string(),
  title: z.string().optional(),
  size: z.enum(['sm', 'md', 'lg', 'full']).optional().default('md'),
  showCloseButton: z.boolean().optional().default(true),
  closeOnBackdrop: z.boolean().optional().default(true),
})
