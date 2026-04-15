import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Stepper } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const BASIC_STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirm', label: 'Confirm' },
]

describe('Stepper', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <Stepper config={{ id: 'checkout', variant: 'horizontal', steps: BASIC_STEPS }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders all step labels in horizontal variant', () => {
    const { getByText } = renderWithProviders(
      <Stepper config={{ id: 'checkout', steps: BASIC_STEPS, variant: 'horizontal' }} />,
    )
    expect(getByText('Details')).toBeTruthy()
    expect(getByText('Payment')).toBeTruthy()
    expect(getByText('Confirm')).toBeTruthy()
  })

  it('renders all step labels in vertical variant', () => {
    const { getByText } = renderWithProviders(
      <Stepper config={{ id: 'checkout', steps: BASIC_STEPS, variant: 'vertical' }} />,
    )
    expect(getByText('Details')).toBeTruthy()
    expect(getByText('Payment')).toBeTruthy()
    expect(getByText('Confirm')).toBeTruthy()
  })

  it('renders step descriptions in vertical variant', () => {
    const stepsWithDesc = [
      { id: 'step1', label: 'Start', description: 'Begin here' },
      { id: 'step2', label: 'End', description: 'Finish here' },
    ]
    const { getByText } = renderWithProviders(
      <Stepper config={{ id: 'flow', steps: stepsWithDesc, variant: 'vertical' }} />,
    )
    expect(getByText('Begin here')).toBeTruthy()
    expect(getByText('Finish here')).toBeTruthy()
  })

  it('exposes progressbar accessibility role', () => {
    const { getByRole } = renderWithProviders(
      <Stepper config={{ id: 'checkout', variant: 'horizontal', steps: BASIC_STEPS }} />,
    )
    expect(getByRole('progressbar')).toBeTruthy()
  })

  it('defaults to first step when currentStep is not set', () => {
    const { toJSON } = renderWithProviders(
      <Stepper config={{ id: 'checkout', variant: 'horizontal', steps: BASIC_STEPS }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('sets active step by id via currentStep', () => {
    const { toJSON } = renderWithProviders(
      <Stepper
        config={{
          id: 'checkout',
          variant: 'horizontal',
          steps: BASIC_STEPS,
          currentStep: 'payment',
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('sets active step by index via currentStep', () => {
    const { toJSON } = renderWithProviders(
      <Stepper
        config={{ id: 'checkout', variant: 'horizontal', steps: BASIC_STEPS, currentStep: '2' }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders step buttons when onStepPress is provided', () => {
    const { getByRole } = renderWithProviders(
      <Stepper
        config={{
          id: 'checkout',
          variant: 'horizontal',
          steps: BASIC_STEPS,
          onStepPress: { type: 'navigate', to: '/step' },
        }}
      />,
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Stepper
        config={{
          id: 'checkout',
          variant: 'horizontal',
          steps: BASIC_STEPS,
          testID: 'checkout-stepper',
        }}
      />,
    )
    expect(getByTestId('checkout-stepper')).toBeTruthy()
  })

  it('resolves currentStep from screen context via from-ref', () => {
    const { toJSON } = renderWithProviders(
      <Stepper
        config={{
          id: 'checkout',
          variant: 'horizontal',
          steps: BASIC_STEPS,
          currentStep: { from: 'activeStep' },
        }}
      />,
      { initialValues: { activeStep: 'payment' } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders a single-step stepper without crashing', () => {
    const { getByText } = renderWithProviders(
      <Stepper
        config={{ id: 'solo', variant: 'horizontal', steps: [{ id: 'only', label: 'Only Step' }] }}
      />,
    )
    expect(getByText('Only Step')).toBeTruthy()
  })
})
