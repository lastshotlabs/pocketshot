import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { Modal } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

// NOTE: Schema defaults (like showCloseButton=true) are not applied when passing
// raw config objects. Tests must pass optional booleans explicitly to match the
// behavior described in the schema. This mirrors the real usage pattern where the
// manifest layer always parses configs through the Zod schema before passing them.

describe('Modal', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Crash-safety ────────────────────────────────────────────────────────────

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Modal config={{ id: 'modal-a' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders ComponentWrapper even when the modal is closed', () => {
    const { toJSON } = renderWithProviders(<Modal config={{ id: 'closed-modal' }} />)
    // ComponentWrapper always renders a View container
    expect(toJSON()).toBeTruthy()
  })

  it('renders without crashing when open via context', () => {
    const { toJSON } = renderWithProviders(<Modal config={{ id: 'open-modal' }} />, {
      initialValues: { '__modal_open-modal': true },
    })
    expect(toJSON()).toBeTruthy()
  })

  it('renders all size variants without crashing', () => {
    const sizes = ['sm', 'md', 'lg', 'full'] as const
    for (const size of sizes) {
      const id = `size-${size}`
      const { toJSON } = renderWithProviders(<Modal config={{ id, size }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  // ── testID via ComponentWrapper ─────────────────────────────────────────────

  it('applies testID to the ComponentWrapper root when testID is provided', () => {
    const { getByTestId } = renderWithProviders(
      <Modal config={{ id: 'wrapper-modal', testID: 'modal-wrapper' }} />,
    )
    expect(getByTestId('modal-wrapper')).toBeTruthy()
  })

  it('uses config.id as testID on ComponentWrapper when testID is not provided', () => {
    const { getByTestId } = renderWithProviders(<Modal config={{ id: 'auto-testid-modal' }} />)
    expect(getByTestId('auto-testid-modal')).toBeTruthy()
  })

  // ── Visibility (open state) ─────────────────────────────────────────────────

  it('renders with visible=false (closed) — Modal stub is present but not visible', () => {
    const { toJSON } = renderWithProviders(<Modal config={{ id: 'vis-modal' }} />)
    const json = JSON.stringify(toJSON())
    // RN Modal stub renders with visible=false
    expect(json).toContain('"visible":false')
  })

  it('renders with visible=true (open) when context flag is set', () => {
    const { toJSON } = renderWithProviders(<Modal config={{ id: 'open-vis-modal' }} />, {
      initialValues: { '__modal_open-vis-modal': true },
    })
    const json = JSON.stringify(toJSON())
    expect(json).toContain('"visible":true')
  })

  // ── Title rendering ─────────────────────────────────────────────────────────

  it('renders the title when open and config.title is provided', () => {
    const { getByText } = renderWithProviders(
      <Modal config={{ id: 'titled-modal', title: 'My Modal Title' }} />,
      { initialValues: { '__modal_titled-modal': true } },
    )
    expect(getByText('My Modal Title')).toBeTruthy()
  })

  it('renders title with accessibilityRole header when open', () => {
    const { getByRole } = renderWithProviders(
      <Modal config={{ id: 'hdr-modal', title: 'Header Modal' }} />,
      { initialValues: { '__modal_hdr-modal': true } },
    )
    expect(getByRole('header')).toBeTruthy()
  })

  it('does not render a header role element when config.title is not set', () => {
    const { toJSON } = renderWithProviders(
      <Modal config={{ id: 'notitle-modal', showCloseButton: false }} />,
      { initialValues: { '__modal_notitle-modal': true } },
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('"header"')
  })

  // ── Close button ────────────────────────────────────────────────────────────

  it('renders the close button when showCloseButton=true and title is set', () => {
    const { getByRole } = renderWithProviders(
      <Modal config={{ id: 'close-btn-modal', title: 'Has Close', showCloseButton: true }} />,
      { initialValues: { '__modal_close-btn-modal': true } },
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('renders close button with testID derived from config.id', () => {
    const { getByTestId } = renderWithProviders(
      <Modal config={{ id: 'my-modal', title: 'Titled', showCloseButton: true }} />,
      { initialValues: { '__modal_my-modal': true } },
    )
    expect(getByTestId('my-modal-close')).toBeTruthy()
  })

  it('renders close button with testID derived from config.testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Modal
        config={{ id: 'testid-modal', title: 'Titled', testID: 'dialog-1', showCloseButton: true }}
      />,
      { initialValues: { '__modal_testid-modal': true } },
    )
    expect(getByTestId('dialog-1-close')).toBeTruthy()
  })

  it('renders the close button symbol ✕ when showCloseButton=true', () => {
    const { getByText } = renderWithProviders(
      <Modal config={{ id: 'symbol-modal', title: 'With X', showCloseButton: true }} />,
      { initialValues: { '__modal_symbol-modal': true } },
    )
    expect(getByText('✕')).toBeTruthy()
  })

  it('does not render close button when showCloseButton=false and title is absent', () => {
    const { toJSON } = renderWithProviders(
      <Modal config={{ id: 'no-close-modal', showCloseButton: false }} />,
      { initialValues: { '__modal_no-close-modal': true } },
    )
    const json = JSON.stringify(toJSON())
    // No TouchableOpacity close button, so no "button" accessibilityRole
    expect(json).not.toContain('"button"')
  })

  // ── Children ────────────────────────────────────────────────────────────────

  it('renders children inside the modal body when open', () => {
    const { getByText } = renderWithProviders(
      <Modal config={{ id: 'children-modal', title: 'With Children' }}>
        <Text>Inner Content</Text>
      </Modal>,
      { initialValues: { '__modal_children-modal': true } },
    )
    expect(getByText('Inner Content')).toBeTruthy()
  })
})
