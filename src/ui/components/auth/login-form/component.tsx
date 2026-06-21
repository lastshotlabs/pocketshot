import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { LoginFormBase } from './standalone'
import type { LoginFormConfig } from './types'

export function LoginForm({ config }: { config: LoginFormConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const handleSubmit = useCallback(
    ({ email, password }: { email: string; password: string }) => {
      setValue('__loginEmail', email)
      setValue('__loginPassword', password)
      void dispatch(config.onSubmit)
    },
    [config.onSubmit, dispatch, setValue],
  )

  const handleForgotPassword = useCallback(() => {
    if (config.forgotPasswordAction) void dispatch(config.forgotPasswordAction)
  }, [config.forgotPasswordAction, dispatch])

  const handleRegister = useCallback(() => {
    if (config.registerAction) void dispatch(config.registerAction)
  }, [config.registerAction, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <LoginFormBase
        id={config.id}
        testID={config.testID}
        submitLabel={config.submitLabel}
        onSubmit={handleSubmit}
        onForgotPassword={config.forgotPasswordAction ? handleForgotPassword : undefined}
        onRegister={config.registerAction ? handleRegister : undefined}
        showSocialButtons={config.showSocialButtons}
        socialProviders={config.socialProviders}
      />
    </ComponentWrapper>
  )
}
