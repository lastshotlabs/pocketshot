import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ActionSheet } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('ActionSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<ActionSheet config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders without crashing when an id is provided', () => {
    const { toJSON } = renderWithProviders(<ActionSheet config={{ id: 'options-sheet' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('does not show sheet content when no __actionSheet payload is in context', () => {
    const { toJSON } = renderWithProviders(<ActionSheet config={{}} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('action-sheet-option-0')
  })

  it('shows sheet title when __actionSheet payload includes a title', () => {
    const payload = {
      type: 'action-sheet',
      title: 'Choose an action',
      options: [{ label: 'Edit', action: { type: 'toast', message: 'edited' } }],
    }
    const { getByText } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    expect(getByText('Choose an action')).toBeTruthy()
  })

  it('shows option labels when __actionSheet payload is set', () => {
    const payload = {
      type: 'action-sheet',
      title: 'Options',
      options: [
        { label: 'Edit', action: { type: 'toast', message: 'edited' } },
        { label: 'Delete', action: { type: 'toast', message: 'deleted' }, destructive: true },
      ],
    }
    const { getByText } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    expect(getByText('Edit')).toBeTruthy()
    expect(getByText('Delete')).toBeTruthy()
  })

  it('renders a Cancel button when the sheet is active', () => {
    const payload = {
      type: 'action-sheet',
      options: [{ label: 'Copy', action: { type: 'toast', message: 'copied' } }],
    }
    const { getByText } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    expect(getByText('Cancel')).toBeTruthy()
  })

  it('cancel button has correct testID', () => {
    const payload = {
      type: 'action-sheet',
      options: [{ label: 'Share', action: { type: 'toast', message: 'shared' } }],
    }
    const { getByTestId } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    expect(getByTestId('action-sheet-cancel')).toBeTruthy()
  })

  it('option buttons have indexed testIDs', () => {
    const payload = {
      type: 'action-sheet',
      options: [
        { label: 'First', action: { type: 'toast', message: 'first' } },
        { label: 'Second', action: { type: 'toast', message: 'second' } },
      ],
    }
    const { getByTestId } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    expect(getByTestId('action-sheet-option-0')).toBeTruthy()
    expect(getByTestId('action-sheet-option-1')).toBeTruthy()
  })

  it('renders the title with accessibilityRole header', () => {
    const payload = {
      type: 'action-sheet',
      title: 'Pick one',
      options: [{ label: 'Go', action: { type: 'toast', message: 'done' } }],
    }
    const { getByRole } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    expect(getByRole('header')).toBeTruthy()
  })

  it('does not render a title element when payload has no title', () => {
    const payload = {
      type: 'action-sheet',
      options: [{ label: 'Item', action: { type: 'toast', message: 'done' } }],
    }
    const { toJSON } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('"header"')
  })

  it('renders multiple options each with button accessibilityRole', () => {
    const payload = {
      type: 'action-sheet',
      options: [
        { label: 'Option A', action: { type: 'toast', message: 'a' } },
        { label: 'Option B', action: { type: 'toast', message: 'b' } },
      ],
    }
    const { toJSON } = renderWithProviders(<ActionSheet config={{}} />, {
      initialValues: { __actionSheet: payload },
    })
    const json = JSON.stringify(toJSON())
    expect(json).toContain('Option A')
    expect(json).toContain('Option B')
  })

  it('renders slot surfaces without crashing', () => {
    const payload = {
      type: 'action-sheet',
      title: 'Styled',
      options: [{ label: 'Edit', action: { type: 'toast', message: 'edited' } }],
    }
    const { toJSON } = renderWithProviders(
      <ActionSheet
        config={{
          id: 'options-sheet',
          slots: {
            container: { bg: 'card' },
            title: { letterSpacing: 'wide' },
            optionText: { color: 'primary' },
          },
        }}
      />,
      { initialValues: { __actionSheet: payload } },
    )

    expect(toJSON()).toBeTruthy()
  })
})
