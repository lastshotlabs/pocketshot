import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const AccordionSchema = z.object({
  id: z.string().optional(),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      icon: z.string().optional(),
      content: z.string().optional(),
    }),
  ),
  defaultOpenIds: z.array(z.string()).optional(),
  allowMultiple: z.boolean().optional().default(true),
  variant: z.enum(['default', 'bordered', 'separated']).optional().default('default'),
  onSectionChange: ActionSchema.optional(),
  testID: z.string().optional(),
})
