import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { RegisterFormBase, type RegisterFieldName } from './standalone'
import type { RegisterFormConfig } from './types'

export function RegisterForm({ config }: { config: RegisterFormConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const handleSubmit = useCallback(
    (values: Record<RegisterFieldName, string>) => {
      setValue('__register_email', values.email)
      setValue('__register_username', values.username)
      setValue('__register_password', values.password)
      setValue('__register_confirmPassword', values.confirmPassword)
      void dispatch(config.onSubmit)
    },
    [config.onSubmit, dispatch, setValue],
  )

  const handleLogin = useCallback(() => {
    if (config.loginAction) void dispatch(config.loginAction)
  }, [config.loginAction, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RegisterFormBase
        id={config.id}
        testID={config.testID}
        submitLabel={config.submitLabel}
        fields={(config.fields ?? ['email', 'password']) as RegisterFieldName[]}
        onSubmit={handleSubmit}
        onLogin={config.loginAction ? handleLogin : undefined}
      />
    </ComponentWrapper>
  )
}
