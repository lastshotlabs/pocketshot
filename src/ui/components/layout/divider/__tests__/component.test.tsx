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

  it('renders with custom marginVertical without crashing', () => {
    const { toJSON } = renderWithProviders(<Divider config={{ marginVertical: 8 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('has accessibilityRole of none', () => {
    const { getByRole } = renderWithProviders(<Divider config={{}} />)
    expect(getByRole('none')).toBeTruthy()
  })
})
