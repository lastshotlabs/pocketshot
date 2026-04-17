import { describe, expect, it } from 'vitest'
import React from 'react'
import { Text } from 'react-native'
import { KeyboardAvoidingScreen } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('KeyboardAvoidingScreen', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<KeyboardAvoidingScreen config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders children and keyboard avoiding wrapper', () => {
    const result = renderWithProviders(
      <KeyboardAvoidingScreen config={{ id: 'composer' }}>
        <Text>keyboard child</Text>
      </KeyboardAvoidingScreen>,
    )
    expect(result.getByText('keyboard child')).toBeTruthy()
    expect(result.getByTestId('composer-keyboard-avoiding')).toBeTruthy()
    expect(result.getByTestId('composer-scroll')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <KeyboardAvoidingScreen
        config={{
          slots: {
            keyboardAvoiding: {
              bg: 'card',
            },
            content: {
              paddingY: 'xl',
            },
          },
        }}
      >
        <Text>styled keyboard screen</Text>
      </KeyboardAvoidingScreen>,
    )
    expect(toJSON()).toBeTruthy()
  })
})
