import React from 'react'
import { StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import type { RowConfig } from './types'

export function Row({ config, children }: { config: RowConfig; children?: React.ReactNode }) {
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
    flexDirection: 'row',
  },
})

