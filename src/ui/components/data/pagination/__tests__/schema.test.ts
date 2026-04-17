import { describe, expect, it } from 'vitest'
import { PaginationSchema } from '../schema'

describe('PaginationSchema', () => {
  it('accepts a minimal pages config', () => {
    expect(
      PaginationSchema.parse({
        id: 'pager',
        mode: 'pages',
        totalPages: 5,
      }),
    ).toBeDefined()
  })

  it('accepts from-ref state and slot surfaces', () => {
    expect(
      PaginationSchema.parse({
        id: 'pager',
        mode: 'pages',
        totalPages: 5,
        currentPage: { from: 'table.page' },
        slots: {
          container: {
            paddingY: 'lg',
          },
          navButton: {
            paddingX: 'sm',
            states: {
              disabled: {
                opacity: 0.4,
              },
            },
          },
          pageText: {
            letterSpacing: 'wide',
          },
          currentPage: {
            color: 'primary',
          },
        },
      }),
    ).toBeDefined()
  })
})
