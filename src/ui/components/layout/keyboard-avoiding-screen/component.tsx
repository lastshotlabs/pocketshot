import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { KeyboardAvoidingScreenBase } from './standalone'
import type { KeyboardAvoidingScreenConfig } from './types'

export function KeyboardAvoidingScreen({
  config,
  children,
}: {
  config: KeyboardAvoidingScreenConfig
  children?: React.ReactNode
}) {
  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>
      <KeyboardAvoidingScreenBase
        scrollable={config.scrollable}
        padding={config.padding as string | number | undefined}
        behavior={config.behavior as 'padding' | 'height' | 'position' | undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID ?? config.id}
      >
        {children}
      </KeyboardAvoidingScreenBase>
    </ComponentWrapper>
  )
}
