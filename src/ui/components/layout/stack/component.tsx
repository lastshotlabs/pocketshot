import React from 'react'
import { StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import type { StackConfig } from './types'

export function Stack({ config, children }: { config: StackConfig; children?: React.ReactNode }) {
  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={styles.container}
    >
      {children}
    </ComponentWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
})

