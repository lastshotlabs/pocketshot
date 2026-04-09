import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { Row } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Row', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Row config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children', () => {
    const { getByText } = renderWithProviders(
      <Row config={{}}>
        <Text>row child</Text>
      </Row>,
    )
    expect(getByText('row child')).toBeTruthy()
  })

  it('forwards testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(<Row config={{ testID: 'row-test' }} />)
    expect(getByTestId('row-test')).toBeTruthy()
  })

  it('uses id as testID when testID is not explicitly set', () => {
    const { getByTestId } = renderWithProviders(<Row config={{ id: 'row-by-id' }} />)
    expect(getByTestId('row-by-id')).toBeTruthy()
  })

  it('renders with a gap without crashing', () => {
    const { toJSON } = renderWithProviders(<Row config={{ gap: 8 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with wrap enabled without crashing', () => {
    const { toJSON } = renderWithProviders(<Row config={{ wrap: true }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with all align variants without crashing', () => {
    const variants = ['flex-start', 'center', 'flex-end', 'stretch'] as const
    for (const align of variants) {
      const { toJSON } = renderWithProviders(<Row config={{ align }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with all justify variants without crashing', () => {
    const variants = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] as const
    for (const justify of variants) {
      const { toJSON } = renderWithProviders(<Row config={{ justify }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with padding props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Row config={{ padding: 4, paddingHorizontal: 8, paddingVertical: 2 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with backgroundColor without crashing', () => {
    const { toJSON } = renderWithProviders(<Row config={{ backgroundColor: '#f0f0f0' }} />)
    expect(toJSON()).toBeTruthy()
  })
})
