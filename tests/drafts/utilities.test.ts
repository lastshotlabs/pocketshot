import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { DraftBulkSelection, runBulkDraftMutation } from '../../src/drafts/bulk'
import { reviewDraftImport } from '../../src/drafts/import-review'

describe('draft import review', () => {
  it('preserves valid rows, reports row errors, and discloses truncation', () => {
    const review = reviewDraftImport(
      [{ title: 'One' }, { title: '' }, { title: 'Three' }, { title: 'Hidden' }],
      z.object({ title: z.string().min(1, 'Title required') }),
      3,
    )
    expect(review.accepted).toEqual([
      { index: 0, value: { title: 'One' } },
      { index: 2, value: { title: 'Three' } },
    ])
    expect(review.issues).toEqual([
      expect.objectContaining({ index: 1, messages: ['Title required'] }),
    ])
    expect(review.truncated).toBe(1)
    expect(review.total).toBe(4)
    expect(review.canImport).toBe(true)
  })

  it('rejects non-array imports explicitly', () => {
    expect(reviewDraftImport({ title: 'Nope' }, z.string()).issues[0]).toEqual(
      expect.objectContaining({ index: -1, messages: ['Import must be an array'] }),
    )
  })
})

describe('bulk draft operations', () => {
  it('tracks selection without duplicates', () => {
    const selection = new DraftBulkSelection<string>()
    selection.select(['one', 'one', 'two'])
    selection.toggle('two')
    selection.toggle('three')
    expect(selection.values()).toEqual(['one', 'three'])
    expect(selection.size).toBe(2)
    selection.clear()
    expect(selection.size).toBe(0)
  })

  it('runs with bounded concurrency and returns partial failures', async () => {
    let active = 0
    let maximum = 0
    const mutate = vi.fn(async (id: number) => {
      active += 1
      maximum = Math.max(maximum, active)
      await Promise.resolve()
      active -= 1
      if (id === 3) throw new Error('failed')
    })
    const result = await runBulkDraftMutation([1, 2, 3, 4, 5], mutate, 2)
    expect(maximum).toBeLessThanOrEqual(2)
    expect(result.succeeded).toEqual(expect.arrayContaining([1, 2, 4, 5]))
    expect(result.failed).toEqual([expect.objectContaining({ id: 3, error: expect.any(Error) })])
  })
})
