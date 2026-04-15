import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

// Action and FromRef are available for future extension
const _ActionSchema = z.custom<Action>()

export const DrawerSchema = extendComponentSchema({
  id: z.string(),
  position: z.enum(['left', 'right']).optional().default('left'),
  widthPercent: z.number().optional().default(80),
  title: z.string().optional(),
  content: z.string().optional(),
  showHandle: z.boolean().optional().default(true),
  closeOnBackdrop: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
