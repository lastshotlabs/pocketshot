import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { CheckboxGroupConfig } from './types'

interface OptionItem {
  value: string
  label: string
  disabled?: boolean
}

export function CheckboxGroup({ config }: { config: CheckboxGroupConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedOptions = resolveFromRef(config.options, values) as OptionItem[]
  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string[] | undefined) : undefined

  const [selected, setSelected] = useState<string[]>(
    resolvedValue ?? config.defaultValue ?? [],
  )

  useEffect(() => {
    if (resolvedValue != null) {
      setSelected(resolvedValue)
    }
  }, [resolvedValue])

  const styles = useMemo(() => makeStyles(tokens, config.orientation), [tokens, config.orientation])

  const handleToggle = useCallback(
    (optionValue: string) => {
      setSelected((prev) => {
        const next = prev.includes(optionValue)
          ? prev.filter((v) => v !== optionValue)
          : [...prev, optionValue]
        setValue(config.id, next)
        if (config.onChangeAction) {
          void dispatch(config.onChangeAction)
        }
        return next
      })
    },
    [config.id, config.onChangeAction, setValue, dispatch],
  )

  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <View
          style={styles.optionsList}
          accessibilityRole="none"
        >
          {(resolvedOptions ?? []).map((option) => {
            const checked = selected.includes(option.value)
            const disabled = option.disabled ?? false
            const itemStyles = makeItemStyles(tokens, checked, disabled)

            return (
              <TouchableOpacity
                key={option.value}
                style={itemStyles.row}
                onPress={() => handleToggle(option.value)}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityLabel={option.label}
                accessibilityState={{ checked, disabled }}
                testID={`${testIDBase}-option-${option.value}`}
              >
                <View style={itemStyles.box}>
                  {checked && <Text style={itemStyles.checkmark}>✓</Text>}
                </View>
                <Text style={itemStyles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, orientation: CheckboxGroupConfig['orientation']) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[2],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    optionsList: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
      gap: orientation === 'horizontal' ? tokens.spacing[4] : tokens.spacing[3],
    },
  })
}

function makeItemStyles(tokens: DesignTokens, checked: boolean, disabled: boolean) {
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
    optionLabel: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
  })
}
