import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { DetailCard } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('DetailCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <DetailCard
        config={{
          sections: [
            {
              fields: [{ label: 'Name', value: 'Taylor' }],
            },
          ],
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('renders title, subtitle, and field values', () => {
    const { getByText } = renderWithProviders(
      <DetailCard
        config={{
          title: 'Profile',
          subtitle: 'Account details',
          sections: [
            {
              title: 'Identity',
              fields: [{ label: 'Name', value: 'Taylor' }],
            },
          ],
        }}
      />,
    )

    expect(getByText('Profile')).toBeTruthy()
    expect(getByText('Account details')).toBeTruthy()
    expect(getByText('IDENTITY')).toBeTruthy()
    expect(getByText('Taylor')).toBeTruthy()
  })

  it('renders edit button when onEditPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <DetailCard
        config={{
          title: 'Profile',
          onEditPress: { type: 'navigate', to: '/edit' },
          sections: [
            {
              fields: [{ label: 'Name', value: 'Taylor' }],
            },
          ],
        }}
      />,
    )

    expect(getByRole('button')).toBeTruthy()
  })

  it('renders loading skeleton without crashing', () => {
    const { toJSON } = renderWithProviders(
      <DetailCard
        config={{
          loading: true,
          sections: [
            {
              fields: [
                { label: 'Name', value: 'Taylor' },
                { label: 'Email', value: 't@example.com' },
              ],
            },
          ],
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('resolves title, subtitle, and field values from screen context', () => {
    const { getByText } = renderWithProviders(
      <DetailCard
        config={{
          title: { from: 'profile.title' },
          subtitle: { from: 'profile.subtitle' },
          sections: [
            {
              fields: [{ label: 'Name', value: { from: 'profile.name' } }],
            },
          ],
        }}
      />,
      {
        initialValues: {
          profile: {
            title: 'Profile',
            subtitle: 'Account details',
            name: 'Taylor',
          },
        },
      },
    )

    expect(getByText('Profile')).toBeTruthy()
    expect(getByText('Account details')).toBeTruthy()
    expect(getByText('Taylor')).toBeTruthy()
  })

  it('renders with top-level and field slot surfaces without crashing', () => {
    const { getByText, toJSON } = renderWithProviders(
      <DetailCard
        config={{
          title: 'Profile',
          sections: [
            {
              fields: [
                {
                  label: 'Email',
                  value: 't@example.com',
                  type: 'email',
                  slots: {
                    fieldLabel: {
                      color: 'muted',
                    },
                  },
                },
              ],
            },
          ],
          slots: {
            panel: {
              bg: 'card',
            },
            title: {
              letterSpacing: 'wide',
            },
            actionButton: {
              paddingX: 'sm',
            },
            fieldValue: {
              color: 'primary',
            },
          },
          onEditPress: { type: 'navigate', to: '/edit' },
        }}
      />,
    )

    expect(getByText('Profile')).toBeTruthy()
    expect(getByText('Email')).toBeTruthy()
    expect(getByText('t@example.com')).toBeTruthy()
    expect(toJSON()).toBeTruthy()
  })
})
