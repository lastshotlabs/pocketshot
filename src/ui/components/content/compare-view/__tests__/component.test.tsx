import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { CompareView } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('CompareView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders side-by-side labels', () => {
    const { getByText } = renderWithProviders(
      <CompareView
        config={{
          left: { label: 'Before', content: 'line one\nline two' },
          right: { label: 'After', content: 'line one\nline three' },
        }}
      />,
    )

    expect(getByText('Before')).toBeTruthy()
    expect(getByText('After')).toBeTruthy()
  })

  it('renders inline mode header text', () => {
    const { getByText } = renderWithProviders(
      <CompareView
        config={{
          left: { label: 'Before', content: 'a' },
          right: { label: 'After', content: 'b' },
          mode: 'inline',
        }}
      />,
    )

    expect(getByText('Before -> After')).toBeTruthy()
  })

  it('resolves content from screen context', () => {
    const { getByText } = renderWithProviders(
      <CompareView
        config={{
          left: { label: 'Original', content: { from: 'diff.left' } },
          right: { label: 'Updated', content: { from: 'diff.right' } },
          mode: 'inline',
        }}
      />,
      {
        initialValues: {
          diff: {
            left: 'const a = 1',
            right: 'const a = 2',
          },
        },
      },
    )

    expect(getByText('- const a = 1')).toBeTruthy()
    expect(getByText('+ const a = 2')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <CompareView
        config={{
          left: { label: 'Before', content: 'a' },
          right: { label: 'After', content: 'b' },
          testID: 'compare-root',
        }}
      />,
    )

    expect(getByTestId('compare-root')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <CompareView
        config={{
          left: { label: 'Before', content: 'a' },
          right: { label: 'After', content: 'b' },
          slots: {
            container: { borderRadius: 'xl' },
            headerText: { letterSpacing: 'wide' },
            panelCodeLine: { color: 'primary' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
