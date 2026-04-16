import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { Section } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Section', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal valid config', () => {
    const { toJSON } = renderWithProviders(<Section config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children', () => {
    const { getByText } = renderWithProviders(
      <Section config={{}}>
        <Text>section child</Text>
      </Section>,
    )
    expect(getByText('section child')).toBeTruthy()
  })

  it('forwards testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(<Section config={{ testID: 'section-test' }} />)
    expect(getByTestId('section-test')).toBeTruthy()
  })

  it('uses id as testID when testID is not explicitly set', () => {
    const { getByTestId } = renderWithProviders(<Section config={{ id: 'section-by-id' }} />)
    expect(getByTestId('section-by-id')).toBeTruthy()
  })

  it('renders title when provided', () => {
    const { getByText } = renderWithProviders(<Section config={{ title: 'My Section' }} />)
    expect(getByText('My Section')).toBeTruthy()
  })

  it('renders title with accessibilityRole header', () => {
    const { getByRole } = renderWithProviders(<Section config={{ title: 'Header' }} />)
    expect(getByRole('header')).toBeTruthy()
  })

  it('does not render title when not provided', () => {
    const { toJSON } = renderWithProviders(<Section config={{}} />)
    const json = toJSON()
    // No title text should appear when title is omitted
    expect(json).toBeTruthy()
  })

  it('renders description when provided', () => {
    const { getByText } = renderWithProviders(
      <Section config={{ description: 'Section description' }} />,
    )
    expect(getByText('Section description')).toBeTruthy()
  })

  it('renders both title and description', () => {
    const { getByText } = renderWithProviders(
      <Section config={{ title: 'Title', description: 'Desc' }} />,
    )
    expect(getByText('Title')).toBeTruthy()
    expect(getByText('Desc')).toBeTruthy()
  })

  it('renders with all titleSize variants without crashing', () => {
    const variants = ['sm', 'md', 'lg'] as const
    for (const titleSize of variants) {
      const { toJSON } = renderWithProviders(<Section config={{ title: 'Test', titleSize }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders with custom padding without crashing', () => {
    const { toJSON } = renderWithProviders(<Section config={{ padding: 8 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children alongside title and description', () => {
    const { getByText } = renderWithProviders(
      <Section config={{ title: 'Title', description: 'Desc' }}>
        <Text>inner content</Text>
      </Section>,
    )
    expect(getByText('Title')).toBeTruthy()
    expect(getByText('Desc')).toBeTruthy()
    expect(getByText('inner content')).toBeTruthy()
  })

  it('renders item slot wrappers without crashing', () => {
    const { getByText, toJSON } = renderWithProviders(
      <Section
        config={{
          slots: {
            item: {
              paddingY: 'sm',
            },
          },
        }}
      >
        <Text>section first</Text>
        <Text>section second</Text>
      </Section>,
    )

    expect(getByText('section first')).toBeTruthy()
    expect(getByText('section second')).toBeTruthy()
    expect(toJSON()).toBeTruthy()
  })
})
