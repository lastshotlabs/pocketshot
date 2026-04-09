import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const StepperSchema = z.object({
  id: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
    }),
  ),
  currentStep: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  variant: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
  onStepPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
