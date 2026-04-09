import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Heading } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Heading', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Heading config={{ text: 'Page Title' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders text content', () => {
    const { getByText } = renderWithProviders(<Heading config={{ text: 'Section Header' }} />)
    expect(getByText('Section Header')).toBeTruthy()
  })

  it('renders all heading levels without crashing', () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const { getByText } = renderWithProviders(
        <Heading config={{ text: `Level ${level}`, level }} />,
      )
      expect(getByText(`Level ${level}`)).toBeTruthy()
    }
  })

  it('renders all align variants without crashing', () => {
    for (const align of ['left', 'center', 'right'] as const) {
      const { toJSON } = renderWithProviders(<Heading config={{ text: 'Aligned', align }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with custom color without crashing', () => {
    const { getByText } = renderWithProviders(
      <Heading config={{ text: 'Colored heading', color: '#0000ff' }} />,
    )
    expect(getByText('Colored heading')).toBeTruthy()
  })

  it('has accessibilityRole of header', () => {
    const { getByRole } = renderWithProviders(<Heading config={{ text: 'Accessible heading' }} />)
    expect(getByRole('header')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Heading config={{ text: 'Tagged', testID: 'heading-main' }} />,
    )
    expect(getByTestId('heading-main')).toBeTruthy()
  })

  it('resolves text from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <Heading config={{ text: { from: 'pageTitle' } }} />,
      { initialValues: { pageTitle: 'Dynamic Heading' } },
    )
    expect(getByText('Dynamic Heading')).toBeTruthy()
  })
})
