import type { z } from 'zod'

export interface DraftImportIssue {
  index: number
  messages: string[]
  input: unknown
}

export interface DraftImportReview<T> {
  accepted: Array<{ index: number; value: T }>
  issues: DraftImportIssue[]
  truncated: number
  total: number
  canImport: boolean
}

export function reviewDraftImport<T>(
  input: unknown,
  itemSchema: z.ZodType<T>,
  maxItems = 1_000,
): DraftImportReview<T> {
  if (!Array.isArray(input)) {
    return {
      accepted: [],
      issues: [{ index: -1, messages: ['Import must be an array'], input }],
      truncated: 0,
      total: 0,
      canImport: false,
    }
  }
  const visible = input.slice(0, maxItems)
  const accepted: DraftImportReview<T>['accepted'] = []
  const issues: DraftImportIssue[] = []
  for (const [index, candidate] of visible.entries()) {
    const result = itemSchema.safeParse(candidate)
    if (result.success) accepted.push({ index, value: result.data })
    else {
      issues.push({
        index,
        messages: result.error.issues.map((issue) => issue.message),
        input: candidate,
      })
    }
  }
  return {
    accepted,
    issues,
    truncated: Math.max(0, input.length - visible.length),
    total: input.length,
    canImport: accepted.length > 0,
  }
}
