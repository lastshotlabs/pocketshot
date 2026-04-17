import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Divider } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Divider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Divider config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with horizontal orientation (default)', () => {
    const { toJSON } = renderWithProviders(<Divider config={{ orientation: 'horizontal' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with vertical orientation without crashing', () => {
    const { toJSON } = renderWithProviders(<Divider config={{ orientation: 'vertical' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with a custom thickness without crashing', () => {
    const { toJSON } = renderWithProviders(<Divider config={{ thickness: 4 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with a custom color without crashing', () => {
    const { toJSON } = renderWithProviders(<Divider config={{ color: '#cccccc' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with shared marginY without crashing', () => {
    const { toJSON } = renderWithProviders(<Divider config={{ marginY: 'md' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('applies testID via the shared base wrapper', () => {
    const { getByTestId } = renderWithProviders(<Divider config={{ testID: 'divider-main' }} />)
    expect(getByTestId('divider-main')).toBeTruthy()
  })

  it('has accessibilityRole of none', () => {
    const { getByRole } = renderWithProviders(<Divider config={{}} />)
    expect(getByRole('none')).toBeTruthy()
  })

  it('renders line slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Divider
        config={{
          slots: {
            line: {
              bg: 'border',
            },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
