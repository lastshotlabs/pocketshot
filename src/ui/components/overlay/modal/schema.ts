import { z } from 'zod'

export const ModalSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  size: z.enum(['sm', 'md', 'lg', 'full']).optional().default('md'),
  showCloseButton: z.boolean().optional().default(true),
  closeOnBackdrop: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
