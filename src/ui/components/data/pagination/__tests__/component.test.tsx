import React from 'react'
import { act } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { Pagination } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Pagination', () => {
  it('renders page controls and indicator', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <Pagination config={{ id: 'pager', mode: 'pages', totalPages: 3, testID: 'pager' }} />,
    )

    expect(getByTestId('pager-previous')).toBeTruthy()
    expect(getByText('1 / 3')).toBeTruthy()
    expect(getByTestId('pager-next')).toBeTruthy()
  })

  it('updates the current page when next is pressed', () => {
    const result = renderWithProviders(
      <Pagination config={{ id: 'pager', mode: 'pages', totalPages: 3, testID: 'pager' }} />,
    )

    const nextButton = result.instance.root.find((node) => node.props.testID === 'pager-next')

    act(() => {
      nextButton.props.onPress()
    })

    expect(result.getByText('2 / 3')).toBeTruthy()
  })

  it('renders load more mode', () => {
    const { getByTestId } = renderWithProviders(
      <Pagination config={{ id: 'pager', mode: 'load-more', testID: 'pager' }} />,
    )

    expect(getByTestId('pager-load-more')).toBeTruthy()
  })

  it('hydrates current page from from-ref and accepts slot surfaces', () => {
    const { getByText, toJSON } = renderWithProviders(
      <Pagination
        config={{
          id: 'pager',
          mode: 'pages',
          totalPages: 5,
          currentPage: { from: 'table.page' },
          testID: 'pager',
          slots: {
            container: {
              paddingY: 'lg',
            },
            navButton: {
              paddingX: 'sm',
            },
            currentPage: {
              color: 'primary',
            },
          },
        }}
      />,
      { initialValues: { table: { page: 3 } } },
    )

    expect(toJSON()).toBeTruthy()
    expect(getByText('3 / 5')).toBeTruthy()
  })
})
