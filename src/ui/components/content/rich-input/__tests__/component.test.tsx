import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { RichInput } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('RichInput', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the toolbar', () => {
    const { getByTestId } = renderWithProviders(<RichInput config={{ id: 'notes' }} />)

    expect(getByTestId('notes-toolbar-bold')).toBeTruthy()
  })

  it('renders a resolved label from screen context', () => {
    const { getByText } = renderWithProviders(
      <RichInput config={{ id: 'notes', label: { from: 'copy.label' } }} />,
      { initialValues: { copy: { label: 'Rich Notes' } } },
    )

    expect(getByText('Rich Notes')).toBeTruthy()
  })

  it('resolves a ref-backed value', () => {
    const { toJSON } = renderWithProviders(
      <RichInput config={{ id: 'notes', value: { from: 'draft.body' } }} />,
      { initialValues: { draft: { body: 'Initial content' } } },
    )

    expect(toJSON()).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <RichInput config={{ id: 'notes', testID: 'rich-input-root' }} />,
    )

    expect(getByTestId('rich-input-root')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <RichInput
        config={{
          id: 'notes',
          slots: {
            toolbar: { borderRadius: 'xl' },
            toolbarLabel: { letterSpacing: 'wide' },
            input: { borderRadius: 'lg' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
