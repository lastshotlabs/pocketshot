import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Spacer } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Spacer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Spacer config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with a custom size without crashing', () => {
    const { toJSON } = renderWithProviders(<Spacer config={{ size: 8 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders in flex mode without crashing', () => {
    const { toJSON } = renderWithProviders(<Spacer config={{ flex: true }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders in fixed size mode (flex: false) without crashing', () => {
    const { toJSON } = renderWithProviders(<Spacer config={{ flex: false, size: 16 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with size 0 without crashing', () => {
    const { toJSON } = renderWithProviders(<Spacer config={{ size: 0 }} />)
    expect(toJSON()).toBeTruthy()
  })
})
