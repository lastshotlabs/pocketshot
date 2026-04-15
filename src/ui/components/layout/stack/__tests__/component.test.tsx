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

  it('renders with all alignItems variants without crashing', () => {
    const variants = ['start', 'center', 'end', 'stretch', 'baseline'] as const
    for (const alignItems of variants) {
      const { toJSON } = renderWithProviders(<Stack config={{ alignItems }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with all justifyContent variants without crashing', () => {
    const variants = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const
    for (const justifyContent of variants) {
      const { toJSON } = renderWithProviders(<Stack config={{ justifyContent }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with padding props without crashing', () => {
    const { toJSON } = renderWithProviders(<Stack config={{ padding: 4, paddingX: 8, paddingY: 2 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with bg without crashing', () => {
    const { toJSON } = renderWithProviders(<Stack config={{ bg: '#f0f0f0' }} />)
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
