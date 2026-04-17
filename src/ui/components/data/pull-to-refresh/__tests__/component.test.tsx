import React from 'react'
import { describe, expect, it } from 'vitest'
import { PullToRefresh } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('PullToRefresh', () => {
  it('renders children inside the scroll container', () => {
    const result = renderWithProviders(
      <PullToRefresh
        config={{
          id: 'feed-refresh',
          onRefresh: { type: 'set-value', target: 'feed.refresh', value: true },
          testID: 'feed-refresh',
        }}
      >
        <></>
      </PullToRefresh>,
    )

    expect(result.getByTestId('feed-refresh-scroll')).toBeTruthy()
  })

  it('hydrates refreshing state from from-ref and accepts slot surfaces', () => {
    const result = renderWithProviders(
      <PullToRefresh
        config={{
          id: 'feed-refresh',
          refreshing: { from: 'feed.refreshing' },
          onRefresh: { type: 'set-value', target: 'feed.refresh', value: true },
          testID: 'feed-refresh',
          slots: {
            scrollView: {
              paddingY: 'lg',
            },
          },
        }}
      />,
      { initialValues: { feed: { refreshing: true } } },
    )

    const scrollNode = result.instance.root.find(
      (node) => node.props.testID === 'feed-refresh-scroll',
    )
    expect(scrollNode.props.refreshControl.props.refreshing).toBe(true)
  })
})
