import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { ScrollContainer } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('ScrollContainer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<ScrollContainer config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children', () => {
    const { getByText } = renderWithProviders(
      <ScrollContainer config={{}}>
        <Text>scroll child</Text>
      </ScrollContainer>,
    )
    expect(getByText('scroll child')).toBeTruthy()
  })

  it('forwards testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <ScrollContainer config={{ testID: 'scroll-test' }} />,
    )
    expect(getByTestId('scroll-test')).toBeTruthy()
  })

  it('uses id as testID when testID is not explicitly set', () => {
    const { getByTestId } = renderWithProviders(<ScrollContainer config={{ id: 'scroll-by-id' }} />)
    expect(getByTestId('scroll-by-id')).toBeTruthy()
  })

  it('renders in horizontal mode without crashing', () => {
    const { toJSON } = renderWithProviders(<ScrollContainer config={{ horizontal: true }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with scroll indicator visible without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ScrollContainer config={{ showsScrollIndicator: true }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with padding without crashing', () => {
    const { toJSON } = renderWithProviders(<ScrollContainer config={{ padding: 4 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with contentPadding without crashing', () => {
    const { toJSON } = renderWithProviders(<ScrollContainer config={{ contentPadding: 8 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with refreshable enabled without crashing', () => {
    const { toJSON } = renderWithProviders(<ScrollContainer config={{ refreshable: true }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with refreshable and onRefresh action without crashing', () => {
    const action = { type: 'refresh' } as unknown as import('../../../../actions/types').Action
    const { toJSON } = renderWithProviders(
      <ScrollContainer config={{ refreshable: true, onRefresh: action }} />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
