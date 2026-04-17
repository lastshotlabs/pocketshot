import { z } from 'zod'
import {
  componentTextAlignSchema,
  extendComponentSchema,
  fontSizeValueSchema,
  fontWeightValueSchema,
  slotsSchema,
} from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const BodySchema = extendComponentSchema({
  text: z.union([z.string(), FromRefSchema]),
  fontSize: fontSizeValueSchema.optional().default('base'),
  fontWeight: fontWeightValueSchema.optional().default('normal'),
  textAlign: componentTextAlignSchema.optional().default('left'),
  numberOfLines: z.number().optional(),
  slots: slotsSchema(['root', 'text']).optional(),
})
