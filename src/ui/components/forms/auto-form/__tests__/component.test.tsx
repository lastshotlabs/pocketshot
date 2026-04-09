import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { AutoForm } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'
import type { Action } from '../../../../actions/types'

const noopSubmit = { type: 'toast', message: 'submitted' } as unknown as Action

describe('AutoForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with a minimal config', () => {
    const { toJSON } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-min',
          fields: [],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the submit button with the configured label', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-submit',
          fields: [],
          submitLabel: 'Save Changes',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Save Changes')).toBeTruthy()
  })

  it('renders a text field with its label', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-text',
          fields: [{ id: 'name', type: 'text', label: 'Full Name', required: false }],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Full Name')).toBeTruthy()
  })

  it('renders an email field', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-email',
          fields: [{ id: 'email', type: 'email', label: 'Email Address', required: false }],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Email Address')).toBeTruthy()
  })

  it('renders a password field', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-password',
          fields: [{ id: 'pass', type: 'password', label: 'Password', required: false }],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Password')).toBeTruthy()
  })

  it('renders a number field', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-number',
          fields: [{ id: 'age', type: 'number', label: 'Age', required: false }],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Age')).toBeTruthy()
  })

  it('renders a select field with its label', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-select',
          fields: [
            {
              id: 'role',
              type: 'select',
              label: 'Role',
              required: false,
              options: [
                { label: 'Admin', value: 'admin' },
                { label: 'Member', value: 'member' },
              ],
            },
          ],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Role')).toBeTruthy()
  })

  it('renders a checkbox field with its label', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-checkbox',
          fields: [
            { id: 'agree', type: 'checkbox', label: 'I agree to the terms', required: false },
          ],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('I agree to the terms')).toBeTruthy()
  })

  it('renders a switch field with its label', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-switch',
          fields: [
            { id: 'notify', type: 'switch', label: 'Enable Notifications', required: false },
          ],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Enable Notifications')).toBeTruthy()
  })

  it('renders multiple fields', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-multi',
          fields: [
            { id: 'name', type: 'text', label: 'Name', required: false },
            { id: 'email', type: 'email', label: 'Email', required: false },
          ],
          submitLabel: 'Go',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    expect(getByText('Name')).toBeTruthy()
    expect(getByText('Email')).toBeTruthy()
    expect(getByText('Go')).toBeTruthy()
  })

  it('shows required indicator on required text field', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-required',
          fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
        }}
      />,
    )
    // The required asterisk is rendered as a child Text node with " *"
    expect(getByText(' *')).toBeTruthy()
  })

  it('applies testID to the wrapper', () => {
    const { getByTestId } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-tid',
          fields: [],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
          testID: 'my-auto-form',
        }}
      />,
    )
    expect(getByTestId('my-auto-form')).toBeTruthy()
  })

  it('applies testID to the submit button', () => {
    const { getByTestId } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-btn',
          fields: [],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
          testID: 'form-btn',
        }}
      />,
    )
    expect(getByTestId('form-btn-submit')).toBeTruthy()
  })

  it('resolves validationErrors from screen context and displays field error', () => {
    const { getByText } = renderWithProviders(
      <AutoForm
        config={{
          id: 'form-errors',
          fields: [{ id: 'name', type: 'text', label: 'Name', required: false }],
          submitLabel: 'Submit',
          onSubmit: noopSubmit,
          onSubmitKey: '__formData',
          validationErrors: { from: 'errors' },
        }}
      />,
      { initialValues: { errors: { name: 'Required' } } },
    )
    expect(getByText('Required')).toBeTruthy()
  })
})
