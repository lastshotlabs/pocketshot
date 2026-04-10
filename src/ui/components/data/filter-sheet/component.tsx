import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Modal as RNModal,
  ScrollView,
  Switch,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { FilterSheetConfig, FilterSheetSectionConfig } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterState = Record<string, unknown>

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay,
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.xl,
      borderTopRightRadius: tokens.radius.xl,
      maxHeight: '85%',
      ...tokens.shadows.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    headerTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.full,
    },
    closeText: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.textMuted,
      lineHeight: 22,
    },
    scrollContent: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
    },
    sectionContainer: {
      marginBottom: tokens.spacing[5],
    },
    sectionLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[2],
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    optionRadio: {
      width: 20,
      height: 20,
      borderRadius: tokens.radius.full,
      borderWidth: 2,
      borderColor: tokens.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionRadioSelected: {
      borderColor: tokens.colors.primary,
    },
    optionRadioInner: {
      width: 10,
      height: 10,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.primary,
    },
    optionCheckbox: {
      width: 20,
      height: 20,
      borderRadius: tokens.radius.sm,
      borderWidth: 2,
      borderColor: tokens.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionCheckboxSelected: {
      borderColor: tokens.colors.primary,
      backgroundColor: tokens.colors.primary,
    },
    checkmark: {
      fontSize: 12,
      color: tokens.colors.primaryForeground,
      lineHeight: 14,
    },
    optionLabel: {
      flex: 1,
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: tokens.spacing[1],
    },
    rangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
      paddingVertical: tokens.spacing[2],
    },
    rangeInput: {
      flex: 1,
      height: 40,
      backgroundColor: tokens.colors.inputBackground,
      borderWidth: 1,
      borderColor: tokens.colors.inputBorder,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.inputText,
      textAlign: 'center' as const,
    },
    rangeSeparator: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.divider,
      gap: tokens.spacing[3],
    },
    resetButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[3],
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
    },
    resetText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    applyButton: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[3],
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.colors.primary,
    },
    applyText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
  })
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

interface SectionProps {
  section: FilterSheetSectionConfig
  value: unknown
  onChange: (sectionId: string, value: unknown) => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  testIDPrefix: string
}

function SelectSection({ section, value, onChange, styles, testIDPrefix }: SectionProps) {
  const selected = (value as string) ?? ''
  return (
    <>
      {section.options?.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(section.id, opt.value)}
          style={styles.optionRow}
          accessibilityRole="radio"
          accessibilityLabel={opt.label}
          accessibilityState={{ checked: selected === opt.value }}
          testID={`${testIDPrefix}-${section.id}-${opt.value}`}
        >
          <View
            style={[
              styles.optionRadio,
              selected === opt.value && styles.optionRadioSelected,
            ]}
          >
            {selected === opt.value && <View style={styles.optionRadioInner} />}
          </View>
          <Text style={styles.optionLabel}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </>
  )
}

function MultiSelectSection({ section, value, onChange, styles, testIDPrefix }: SectionProps) {
  const selected = (value as string[]) ?? []
  const handleToggle = useCallback(
    (optValue: string) => {
      const next = selected.includes(optValue)
        ? selected.filter((s) => s !== optValue)
        : [...selected, optValue]
      onChange(section.id, next)
    },
    [section.id, selected, onChange],
  )

  return (
    <>
      {section.options?.map((opt) => {
        const isSelected = selected.includes(opt.value)
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => handleToggle(opt.value)}
            style={styles.optionRow}
            accessibilityRole="checkbox"
            accessibilityLabel={opt.label}
            accessibilityState={{ checked: isSelected }}
            testID={`${testIDPrefix}-${section.id}-${opt.value}`}
          >
            <View
              style={[
                styles.optionCheckbox,
                isSelected && styles.optionCheckboxSelected,
              ]}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        )
      })}
    </>
  )
}

function RangeSection({ section, value, onChange, styles, testIDPrefix }: SectionProps) {
  const range = (value as { min?: number; max?: number }) ?? {}
  return (
    <View style={styles.rangeContainer}>
      <TouchableOpacity
        style={styles.rangeInput}
        accessibilityLabel={`${section.label} minimum`}
        accessibilityRole="adjustable"
        testID={`${testIDPrefix}-${section.id}-min`}
        onPress={() => {
          const current = range.min ?? section.min ?? 0
          onChange(section.id, { ...range, min: current })
        }}
      >
        <Text style={{ color: range.min != null ? styles.optionLabel.color : styles.rangeSeparator.color }}>
          {range.min != null ? String(range.min) : 'Min'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.rangeSeparator}>—</Text>
      <TouchableOpacity
        style={styles.rangeInput}
        accessibilityLabel={`${section.label} maximum`}
        accessibilityRole="adjustable"
        testID={`${testIDPrefix}-${section.id}-max`}
        onPress={() => {
          const current = range.max ?? section.max ?? 100
          onChange(section.id, { ...range, max: current })
        }}
      >
        <Text style={{ color: range.max != null ? styles.optionLabel.color : styles.rangeSeparator.color }}>
          {range.max != null ? String(range.max) : 'Max'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

function ToggleSection({ section, value, onChange, tokens, styles, testIDPrefix }: SectionProps) {
  const enabled = Boolean(value)
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.optionLabel}>{section.label}</Text>
      <Switch
        value={enabled}
        onValueChange={(v) => onChange(section.id, v)}
        trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
        thumbColor={tokens.colors.surface}
        accessibilityLabel={section.label}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        testID={`${testIDPrefix}-${section.id}-toggle`}
      />
    </View>
  )
}

// ---------------------------------------------------------------------------
// FilterSheet
// ---------------------------------------------------------------------------

/**
 * Bottom-sheet advanced filter panel. Opens via setValue('__filterSheet_<id>', true).
 * Renders sections with select, multi-select, range, and toggle controls.
 * Publishes filter state via setValue on apply.
 */
export function FilterSheet({ config }: { config: FilterSheetConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()

  const isOpen = Boolean(getValue(`__filterSheet_${config.id}`))
  const [filterState, setFilterState] = useState<FilterState>({})
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(300)).current
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const title = config.title ?? 'Filters'
  const baseTestID = config.testID ?? config.id

  useEffect(() => {
    if (isOpen) {
      opacity.setValue(0)
      translateY.setValue(300)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start()
    }
  }, [isOpen, opacity, translateY])

  const handleClose = useCallback(() => {
    setValue(`__filterSheet_${config.id}`, false)
  }, [config.id, setValue])

  const handleSectionChange = useCallback((sectionId: string, value: unknown) => {
    setFilterState((prev) => ({ ...prev, [sectionId]: value }))
  }, [])

  const handleApply = useCallback(async () => {
    if (config.id) {
      setValue(config.id, filterState)
    }
    handleClose()
    await dispatch(config.onApply)
  }, [config.id, config.onApply, filterState, setValue, handleClose, dispatch])

  const handleReset = useCallback(async () => {
    setFilterState({})
    if (config.id) {
      setValue(config.id, {})
    }
    if (config.onReset) {
      await dispatch(config.onReset)
    }
  }, [config.id, config.onReset, setValue, dispatch])

  const renderSection = useCallback(
    (section: FilterSheetSectionConfig) => {
      const props: SectionProps = {
        section,
        value: filterState[section.id],
        onChange: handleSectionChange,
        tokens,
        styles,
        testIDPrefix: baseTestID,
      }

      return (
        <View key={section.id} style={styles.sectionContainer}>
          {section.type !== 'toggle' && (
            <Text style={styles.sectionLabel}>{section.label}</Text>
          )}
          {section.type === 'select' && <SelectSection {...props} />}
          {section.type === 'multi-select' && <MultiSelectSection {...props} />}
          {section.type === 'range' && <RangeSection {...props} />}
          {section.type === 'toggle' && <ToggleSection {...props} />}
        </View>
      )
    },
    [filterState, handleSectionChange, tokens, styles, baseTestID],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Dismiss filters">
          <Animated.View style={[styles.backdrop, { opacity }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle} accessibilityRole="header">
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    accessibilityLabel="Close filters"
                    accessibilityRole="button"
                    testID={`${baseTestID}-close`}
                  >
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Sections */}
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {config.sections.map(renderSection)}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                  {config.onReset && (
                    <TouchableOpacity
                      onPress={handleReset}
                      style={styles.resetButton}
                      accessibilityRole="button"
                      accessibilityLabel="Reset filters"
                      testID={`${baseTestID}-reset`}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resetText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={handleApply}
                    style={styles.applyButton}
                    accessibilityRole="button"
                    accessibilityLabel="Apply filters"
                    testID={`${baseTestID}-apply`}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.applyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    </ComponentWrapper>
  )
}
