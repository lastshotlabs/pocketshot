import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { Tooltip } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Tooltip', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the trigger text', () => {
    const { getByText } = renderWithProviders(
      <Tooltip config={{ trigger: 'Info', content: 'Helpful text' }} />,
    )
    expect(getByText('Info')).toBeTruthy()
  })

  it('resolves trigger and content from screen context', () => {
    const { getByText } = renderWithProviders(
      <Tooltip
        config={{
          trigger: { from: 'tooltip.trigger' },
          content: { from: 'tooltip.content' },
        }}
      />,
      { initialValues: { tooltip: { trigger: 'More', content: 'Details' } } },
    )
    expect(getByText('More')).toBeTruthy()
  })

  it('accepts shared styling props and named slots without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Tooltip
        config={{
          trigger: 'Info',
          content: 'Helpful text',
          color: 'muted',
          fontSize: 'sm',
          slots: {
            root: { paddingX: 'sm' },
            content: { bg: 'muted' },
            arrow: { opacity: 0.8 },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
