import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { Card } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Card', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Card config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children', () => {
    const { getByText } = renderWithProviders(
      <Card config={{}}>
        <Text>card content</Text>
      </Card>,
    )
    expect(getByText('card content')).toBeTruthy()
  })

  it('forwards testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(<Card config={{ testID: 'card-main' }} />)
    expect(getByTestId('card-main')).toBeTruthy()
  })

  it('renders as a button when onPress is provided', () => {
    const action = {
      type: 'haptic',
      style: 'light',
    } as unknown as import('../../../../actions/types').Action
    const { getByRole } = renderWithProviders(
      <Card config={{ onPress: action }}>
        <Text>pressable</Text>
      </Card>,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('renders children inside a pressable card', () => {
    const action = {
      type: 'haptic',
      style: 'light',
    } as unknown as import('../../../../actions/types').Action
    const { getByText } = renderWithProviders(
      <Card config={{ onPress: action }}>
        <Text>inside pressable</Text>
      </Card>,
    )
    expect(getByText('inside pressable')).toBeTruthy()
  })

  it('renders with all borderRadius variants without crashing', () => {
    const variants = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
    for (const borderRadius of variants) {
      const { toJSON } = renderWithProviders(<Card config={{ borderRadius }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with all shadow variants without crashing', () => {
    const variants = ['none', 'sm', 'md', 'lg', 'xl'] as const
    for (const shadow of variants) {
      const { toJSON } = renderWithProviders(<Card config={{ shadow }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with a custom bg without crashing', () => {
    const { toJSON } = renderWithProviders(<Card config={{ bg: '#ff0000' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with a custom padding without crashing', () => {
    const { toJSON } = renderWithProviders(<Card config={{ padding: 8 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('uses id as testID when testID is not explicitly set', () => {
    const { getByTestId } = renderWithProviders(<Card config={{ id: 'card-by-id' }} />)
    expect(getByTestId('card-by-id')).toBeTruthy()
  })
})
