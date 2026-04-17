import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const CodeBlockSchema = extendComponentSchema({
  id: z.string().optional(),
  code: z.union([z.string(), FromRefSchema]),
  language: z.string().optional(),
  showLineNumbers: z.boolean().optional().default(true),
  showCopyButton: z.boolean().optional().default(true),
  maxLines: z.number().optional(),
  onCopy: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'header',
    'langLabel',
    'copyButton',
    'copyText',
    'scrollArea',
    'scrollContent',
    'lineRow',
    'lineNumber',
    'codeLine',
    'showMoreButton',
    'showMoreText',
  ]).optional(),
})
