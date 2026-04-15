import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const StepperSchema = extendComponentSchema({
  id: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
    }),
  ),
  currentStep: z.union([z.string(), FromRefSchema]).optional(),
  variant: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
  onStepPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
