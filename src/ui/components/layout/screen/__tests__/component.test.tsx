import { describe, expect, it } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { Screen } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Screen', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Screen config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children in scrollable mode', () => {
    const result = renderWithProviders(
      <Screen config={{ id: 'screen' }}>
        <Text>screen child</Text>
      </Screen>,
    )
    expect(result.getByText('screen child')).toBeTruthy()
    expect(result.getByTestId('screen-scroll')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Screen
        config={{
          slots: {
            viewport: {
              bg: 'card',
            },
            content: {
              paddingY: 'xl',
            },
          },
        }}
      >
        <Text>styled screen</Text>
      </Screen>,
    )
    expect(toJSON()).toBeTruthy()
  })
})
