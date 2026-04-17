import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Accordion } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const config = {
  id: 'faq',
  sections: [
    { id: 'overview', title: 'Overview', subtitle: 'Start here', content: 'Overview content' },
    { id: 'details', title: 'Details', content: 'Details content' },
  ],
}

describe('Accordion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Accordion config={config} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders section titles and derived testIDs', () => {
    const result = renderWithProviders(<Accordion config={config} />)
    expect(result.getByText('Overview')).toBeTruthy()
    expect(result.getByText('Details')).toBeTruthy()
    expect(result.getByTestId('faq-overview')).toBeTruthy()
  })

  it('renders default open content', () => {
    const result = renderWithProviders(
      <Accordion config={{ ...config, defaultOpenIds: ['overview'] }} />,
    )
    expect(result.getByText('Overview content')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Accordion
        config={{
          ...config,
          slots: {
            container: { borderRadius: 'lg' },
            title: { letterSpacing: 'wide' },
            body: { paddingY: 'sm' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
