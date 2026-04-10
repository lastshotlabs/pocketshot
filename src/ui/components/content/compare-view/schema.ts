import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

const SideSchema = z.object({
  label: z.string(),
  content: z.union([z.string(), FromRefSchema]),
})

export const CompareViewSchema = z.object({
  id: z.string().optional(),
  left: SideSchema,
  right: SideSchema,
  mode: z.enum(['side-by-side', 'inline']).optional().default('side-by-side'),
  showLineNumbers: z.boolean().optional().default(true),
  highlightDiffs: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
