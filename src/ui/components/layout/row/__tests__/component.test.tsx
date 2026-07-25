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

  it('renders with flexWrap enabled without crashing', () => {
    const { toJSON } = renderWithProviders(<Row config={{ flexWrap: 'wrap' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with all alignItems variants without crashing', () => {
    const variants = ['start', 'center', 'end', 'stretch', 'baseline'] as const
    for (const alignItems of variants) {
      const { toJSON } = renderWithProviders(<Row config={{ alignItems }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with all justifyContent variants without crashing', () => {
    const variants = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const
    for (const justifyContent of variants) {
      const { toJSON } = renderWithProviders(<Row config={{ justifyContent }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with padding props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Row config={{ padding: 4, paddingX: 8, paddingY: 2 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with bg without crashing', () => {
    const { toJSON } = renderWithProviders(<Row config={{ bg: '#f0f0f0' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders item slot wrappers without crashing', () => {
    const { getByText, toJSON } = renderWithProviders(
      <Row
        config={{
          slots: {
            item: {
              paddingX: 'sm',
            },
          },
        }}
      >
        <Text>first row child</Text>
        <Text>second row child</Text>
      </Row>,
    )

    expect(getByText('first row child')).toBeTruthy()
    expect(getByText('second row child')).toBeTruthy()
    expect(toJSON()).toBeTruthy()
  })
})
