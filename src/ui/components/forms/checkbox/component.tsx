import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { CheckboxConfig } from './types'

export function Checkbox({ config }: { config: CheckboxConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedChecked =
    config.checked != null ? resolveFromRef(config.checked, values) : undefined

  const [localChecked, setLocalChecked] = useState<boolean>(
    (resolvedChecked as boolean | undefined) ?? config.defaultChecked ?? false,
  )

  useEffect(() => {
    if (resolvedChecked != null) {
      setLocalChecked(resolvedChecked as boolean)
    }
  }, [resolvedChecked])

  const styles = makeStyles(tokens, localChecked, config.disabled)

  function handlePress() {
    if (config.disabled) return
    const next = !localChecked
    setLocalChecked(next)
    setValue(config.id, next)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <TouchableOpacity
        style={styles.row}
        onPress={handlePress}
        activeOpacity={config.disabled ? 1 : 0.7}
        accessibilityRole="checkbox"
        accessibilityLabel={config.label}
        accessibilityState={{ checked: localChecked, disabled: config.disabled }}
        testID={config.testID ?? config.id}
      >
        <View style={styles.box}>{localChecked && <Text style={styles.checkmark}>✓</Text>}</View>
        <Text style={styles.label}>{config.label}</Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, checked: boolean, disabled: boolean | undefined) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[3],
      opacity: disabled ? 0.5 : 1,
    },
    box: {
      width: 22,
      height: 22,
      borderRadius: tokens.radius.sm,
      borderWidth: 2,
      borderColor: checked ? tokens.colors.primary : tokens.colors.inputBorder,
      backgroundColor: checked ? tokens.colors.primary : tokens.colors.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightBold,
      lineHeight: 16,
    },
    label: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
  })
}
