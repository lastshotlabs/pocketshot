import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { Stack } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Stack', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Stack config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children', () => {
    const { getByText } = renderWithProviders(
      <Stack config={{}}>
        <Text>stack child</Text>
      </Stack>,
    )
    expect(getByText('stack child')).toBeTruthy()
  })

  it('forwards testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(<Stack config={{ testID: 'stack-test' }} />)
    expect(getByTestId('stack-test')).toBeTruthy()
  })

  it('uses id as testID when testID is not explicitly set', () => {
    const { getByTestId } = renderWithProviders(<Stack config={{ id: 'stack-by-id' }} />)
    expect(getByTestId('stack-by-id')).toBeTruthy()
  })

  it('renders with a gap without crashing', () => {
    const { toJSON } = renderWithProviders(<Stack config={{ gap: 8 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with all align variants without crashing', () => {
    const variants = ['flex-start', 'center', 'flex-end', 'stretch'] as const
    for (const align of variants) {
      const { toJSON } = renderWithProviders(<Stack config={{ align }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with all justify variants without crashing', () => {
    const variants = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] as const
    for (const justify of variants) {
      const { toJSON } = renderWithProviders(<Stack config={{ justify }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with padding props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Stack config={{ padding: 4, paddingHorizontal: 8, paddingVertical: 2 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with backgroundColor without crashing', () => {
    const { toJSON } = renderWithProviders(<Stack config={{ backgroundColor: '#f0f0f0' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders multiple children', () => {
    const { getByText } = renderWithProviders(
      <Stack config={{}}>
        <Text>first</Text>
        <Text>second</Text>
        <Text>third</Text>
      </Stack>,
    )
    expect(getByText('first')).toBeTruthy()
    expect(getByText('second')).toBeTruthy()
    expect(getByText('third')).toBeTruthy()
  })
})
