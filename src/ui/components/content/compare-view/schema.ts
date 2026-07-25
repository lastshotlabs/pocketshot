import { z } from 'zod'
import { extendComponentSchema, looseSlots } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const SideSchema = z.object({
  label: z.string(),
  content: z.union([z.string(), FromRefSchema]),
})

export const CompareViewSchema = extendComponentSchema({
  id: z.string().optional(),
  left: SideSchema,
  right: SideSchema,
  mode: z.enum(['side-by-side', 'inline']).optional().default('side-by-side'),
  showLineNumbers: z.boolean().optional().default(true),
  highlightDiffs: z.boolean().optional().default(true),
  testID: z.string().optional(),
  slots: looseSlots([
    'root',
    'container',
    'header',
    'headerText',
    'inlineScroll',
    'inlineContent',
    'inlineLineRow',
    'inlineGutter',
    'inlineLineNumber',
    'inlineCodeLine',
    'panels',
    'panel',
    'panelHeader',
    'panelLabel',
    'divider',
    'panelScroll',
    'panelContent',
    'panelLineRow',
    'panelLineNumber',
    'panelCodeLine',
  ]).optional(),
})
