import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { BodyConfig } from './types'

export function Body({ config }: { config: BodyConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const styles = makeStyles(tokens, config)

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Text
        style={styles.body}
        numberOfLines={config.numberOfLines}
        accessibilityRole="text"
        testID={config.testID ?? config.id}
      >
        {text}
      </Text>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: BodyConfig) {
  const textStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const fontSize =
    typeof textStyle.fontSize === 'number' ? textStyle.fontSize : tokens.typography.fontSizeMd

  return StyleSheet.create({
    body: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightRegular,
      color: tokens.colors.text,
      textAlign: 'left',
      lineHeight: fontSize * tokens.typography.lineHeightNormal,
      ...textStyle,
    },
  })
}

