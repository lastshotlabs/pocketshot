import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { AvatarGroup } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const TWO_AVATARS = [
  { src: undefined, name: 'Alice' },
  { src: undefined, name: 'Bob' },
]

const SIX_AVATARS = [
  { name: 'Alice' },
  { name: 'Bob' },
  { name: 'Carol' },
  { name: 'Dave' },
  { name: 'Eve' },
  { name: 'Frank' },
]

describe('AvatarGroup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <AvatarGroup config={{ avatars: TWO_AVATARS, size: 'sm' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders all size variants without crashing', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const { toJSON } = renderWithProviders(
        <AvatarGroup config={{ avatars: TWO_AVATARS, size }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('shows overflow badge when avatars exceed maxVisible', () => {
    const { getByText } = renderWithProviders(
      <AvatarGroup config={{ avatars: SIX_AVATARS, maxVisible: 4, size: 'sm' }} />,
    )
    // 6 total - 4 visible = +2 overflow
    expect(getByText('+2')).toBeTruthy()
  })

  it('does not show overflow badge when avatars fit within maxVisible', () => {
    const { toJSON } = renderWithProviders(
      <AvatarGroup config={{ avatars: TWO_AVATARS, maxVisible: 4, size: 'sm' }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('"+')
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <AvatarGroup config={{ avatars: TWO_AVATARS, size: 'sm', testID: 'avatar-group-main' }} />,
    )
    expect(getByTestId('avatar-group-main')).toBeTruthy()
  })

  it('renders a pressable button when onPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <AvatarGroup
        config={{
          avatars: TWO_AVATARS,
          size: 'sm',
          onPress: { type: 'navigate', path: '/Members' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('does not render a button when onPress is absent', () => {
    const { toJSON } = renderWithProviders(
      <AvatarGroup config={{ avatars: TWO_AVATARS, size: 'sm' }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('"button"')
  })

  it('resolves avatars from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <AvatarGroup config={{ avatars: { from: 'members' }, maxVisible: 4, size: 'sm' }} />,
      {
        initialValues: {
          members: [
            { name: 'Alice' },
            { name: 'Bob' },
            { name: 'Carol' },
            { name: 'Dave' },
            { name: 'Eve' },
          ],
        },
      },
    )
    // 5 total - 4 visible = +1 overflow
    expect(getByText('+1')).toBeTruthy()
  })

  it('renders empty group without crashing when avatars array is empty', () => {
    const { toJSON } = renderWithProviders(<AvatarGroup config={{ avatars: [], size: 'sm' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('respects custom overlap value', () => {
    const { toJSON } = renderWithProviders(
      <AvatarGroup config={{ avatars: TWO_AVATARS, size: 'md', overlap: 12 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
