import { describe, it, expect } from 'vitest'
import { StepperSchema } from '../schema'

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirm', label: 'Confirm' },
]

describe('StepperSchema', () => {
  it('parses a valid config', () => {
    const result = StepperSchema.parse({ id: 'checkout', steps })
    expect(result.steps).toHaveLength(3)
  })

  it('requires id', () => {
    expect(StepperSchema.safeParse({ steps }).success).toBe(false)
  })

  it('requires steps', () => {
    expect(StepperSchema.safeParse({ id: 'x' }).success).toBe(false)
  })

  it('applies default variant', () => {
    const result = StepperSchema.parse({ id: 'x', steps })
    expect(result.variant).toBe('horizontal')
  })

  it('accepts vertical variant', () => {
    const result = StepperSchema.parse({ id: 'x', steps, variant: 'vertical' })
    expect(result.variant).toBe('vertical')
  })

  it('rejects invalid variant', () => {
    expect(StepperSchema.safeParse({ id: 'x', steps, variant: 'circular' }).success).toBe(false)
  })

  it('accepts from-ref currentStep', () => {
    const result = StepperSchema.parse({ id: 'x', steps, currentStep: { from: 'wizard' } })
    expect(result.currentStep).toEqual({ from: 'wizard' })
  })

  it('accepts string currentStep', () => {
    const result = StepperSchema.parse({ id: 'x', steps, currentStep: 'payment' })
    expect(result.currentStep).toBe('payment')
  })

  it('step accepts optional description', () => {
    const result = StepperSchema.parse({
      id: 'x',
      steps: [{ id: 'details', label: 'Details', description: 'Enter your info' }],
    })
    expect(result.steps[0].description).toBe('Enter your info')
  })

  it('step requires id and label', () => {
    expect(StepperSchema.safeParse({ id: 'x', steps: [{ label: 'X' }] }).success).toBe(false)
    expect(StepperSchema.safeParse({ id: 'x', steps: [{ id: 'x' }] }).success).toBe(false)
  })
})
