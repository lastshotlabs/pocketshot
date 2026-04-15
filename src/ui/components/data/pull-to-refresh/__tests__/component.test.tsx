import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { PullToRefresh } from '../component'
import { PullToRefreshSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return PullToRefreshSchema.parse({
    id: 'refresh',
    onRefresh: { type: 'custom' },
    ...overrides,
  })
}

describe('PullToRefresh', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <PullToRefresh config={cfg()}>
        <></>
      </PullToRefresh>,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('applies the root testID', () => {
    const { getByTestId } = renderWithProviders(
      <PullToRefresh config={cfg({ testID: 'refresh-root' })}>
        <></>
      </PullToRefresh>,
    )

    expect(getByTestId('refresh-root')).toBeTruthy()
  })

  it('accepts shared color overrides without crashing', () => {
    const { toJSON } = renderWithProviders(
      <PullToRefresh config={cfg({ color: 'primary' })}>
        <></>
      </PullToRefresh>,
    )

    expect(toJSON()).toBeTruthy()
  })
})
