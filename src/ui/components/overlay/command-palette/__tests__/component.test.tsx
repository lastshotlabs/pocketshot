import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { CommandPalette } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const config = {
  id: 'commands',
  items: [
    {
      id: 'open-settings',
      label: 'Open Settings',
      description: 'Navigate to settings',
      group: 'Navigation',
      shortcut: 'G S',
      onSelect: { type: 'set-value' as const, target: 'commands.settings', value: true },
    },
    {
      id: 'new-post',
      label: 'New Post',
      description: 'Create a post',
      group: 'Create',
      onSelect: { type: 'set-value' as const, target: 'commands.post', value: true },
    },
  ],
}

describe('CommandPalette', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing when closed', () => {
    const { toJSON } = renderWithProviders(<CommandPalette config={config} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders search input and items when open', () => {
    const result = renderWithProviders(<CommandPalette config={config} />, {
      initialValues: { __commandPalette_commands: true },
    })

    expect(result.getByTestId('commands-search')).toBeTruthy()
    expect(result.getByText('Open Settings')).toBeTruthy()
    expect(result.getByText('New Post')).toBeTruthy()
  })

  it('renders group labels and item testIDs', () => {
    const result = renderWithProviders(<CommandPalette config={config} />, {
      initialValues: { __commandPalette_commands: true },
    })

    expect(result.getByText('Navigation')).toBeTruthy()
    expect(result.getByText('Create')).toBeTruthy()
    expect(result.getByTestId('command-palette-item-open-settings')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <CommandPalette
        config={{
          ...config,
          slots: {
            panel: { bg: 'card' },
            searchInput: { color: 'foreground' },
            itemLabel: { letterSpacing: 'wide' },
            emptyText: { color: 'muted' },
          },
        }}
      />,
      { initialValues: { __commandPalette_commands: true } },
    )

    expect(toJSON()).toBeTruthy()
  })
})
