import { useState, useCallback } from 'react'
import { useScreenContext } from '../context/ScreenContext'
import { resolveFromRef } from '../components/_base/fromRef'
import type { AutoFormConfig, AutoFormField } from '../components/forms/auto-form/types'

function getDefaultValue(field: AutoFormField): unknown {
  if (field.defaultValue != null) return field.defaultValue
  if (field.type === 'checkbox' || field.type === 'switch') return false
  if (field.type === 'number') return 0
  return ''
}

export interface UseAutoFormReturn {
  /** Current field values keyed by field id. */
  formState: Record<string, unknown>
  /** Update a single field value. */
  updateField: (id: string, value: unknown) => void
  /** Submit the form: publishes formState to ScreenContext and dispatches onSubmit. */
  handleSubmit: () => Promise<void>
  /** Validation errors keyed by field id, resolved from ScreenContext if config uses from-ref. */
  validationErrors: Record<string, string> | undefined
}

/**
 * Headless hook for AutoForm behavior. Manages field state, validation error
 * resolution, and submit dispatch. Use this when building a custom form UI
 * while retaining the config-driven submit action and validation system.
 *
 * @example
 * const { formState, updateField, handleSubmit, validationErrors } = useAutoForm(config)
 */
export function useAutoForm(config: AutoFormConfig): UseAutoFormReturn {
  const { setValue, dispatch, values } = useScreenContext()

  const validationErrors =
    config.validationErrors != null
      ? (resolveFromRef(config.validationErrors, values) as Record<string, string> | undefined)
      : undefined

  const [formState, setFormState] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const field of config.fields) {
      initial[field.id] = getDefaultValue(field)
    }
    return initial
  })

  const updateField = useCallback((id: string, value: unknown) => {
    setFormState((prev) => ({ ...prev, [id]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    setValue(config.onSubmitKey ?? '__formData', formState)
    await dispatch(config.onSubmit)
  }, [config.onSubmitKey, config.onSubmit, formState, setValue, dispatch])

  return { formState, updateField, handleSubmit, validationErrors }
}
