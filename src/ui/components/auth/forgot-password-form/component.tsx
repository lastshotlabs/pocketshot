import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ForgotPasswordFormBase } from './standalone'
import type { ForgotPasswordFormConfig } from './types'

export function ForgotPasswordForm({ config }: { config: ForgotPasswordFormConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const handleSubmit = useCallback(
    async ({ email }: { email: string }) => {
      setValue('__forgotEmail', email)
      await dispatch(config.onSubmit)
    },
    [config.onSubmit, dispatch, setValue],
  )

  const handleBack = useCallback(() => {
    if (config.backAction) void dispatch(config.backAction)
  }, [config.backAction, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ForgotPasswordFormBase
        id={config.id}
        testID={config.testID}
        submitLabel={config.submitLabel}
        onSubmit={handleSubmit}
        onBack={config.backAction ? handleBack : undefined}
      />
    </ComponentWrapper>
  )
}
