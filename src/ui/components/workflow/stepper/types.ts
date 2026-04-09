import type { z } from 'zod'
import type { StepperSchema } from './schema'

export type StepperConfig = z.input<typeof StepperSchema>
export type StepItem = StepperConfig['steps'][number]
export type StepState = 'completed' | 'active' | 'upcoming'
