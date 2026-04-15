import React from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { LinkConfig } from './types'

const FONT_SIZE_MAP = {
  sm: 'fontSizeSm',
  md: 'fontSizeMd',
  lg: 'fontSizeLg',
} as const

export function Link({ config }: { config: LinkConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const styles = makeStyles(tokens, config)

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={() => void dispatch(config.action)}
        accessibilityRole="link"
        accessibilityLabel={text}
        activeOpacity={0.7}
        testID={config.testID ?? config.id}
      >
        <Text style={styles.link}>{text}</Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: LinkConfig) {
  const fontSizeKey = FONT_SIZE_MAP[config.size ?? 'md']
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  return StyleSheet.create({
    link: {
      fontSize:
        typeof sharedTextStyle.fontSize === 'number'
          ? sharedTextStyle.fontSize
          : tokens.typography[fontSizeKey],
      fontWeight:
        typeof sharedTextStyle.fontWeight === 'string'
          ? sharedTextStyle.fontWeight
          : tokens.typography.fontWeightMedium,
      color:
        typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.primary,
      textAlign:
        sharedTextStyle.textAlign === 'center' ||
        sharedTextStyle.textAlign === 'right' ||
        sharedTextStyle.textAlign === 'justify'
          ? sharedTextStyle.textAlign
          : 'left',
      lineHeight:
        typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
      letterSpacing:
        typeof sharedTextStyle.letterSpacing === 'number'
          ? sharedTextStyle.letterSpacing
          : undefined,
      textDecorationLine: config.underline ? 'underline' : 'none',
    },
  })
}

