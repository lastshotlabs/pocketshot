import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Modal as RNModal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export type FilterSheetSectionType = 'select' | 'multi-select' | 'range' | 'toggle'

export interface FilterSheetSection {
  id: string
  label: string
  type: FilterSheetSectionType
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
}

export type FilterSheetState = Record<string, unknown>

export interface FilterSheetBaseProps {
  /** Whether the sheet is visible. */
  open: boolean
  /** Called when the sheet should close (overlay tap, close button, dismiss). */
  onClose: () => void
  /** Sheet title. */
  title?: string
  /** Filter sections to render. */
  sections: FilterSheetSection[]
  /** Called when "Apply" is pressed with the current filter state. */
  onApply: (state: FilterSheetState) => void
  /** Called when "Reset" is pressed. When omitted, the reset button is hidden. */
  onReset?: () => void
  /** Initial filter state. */
  initialState?: FilterSheetState
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone FilterSheet — plain React props, no manifest required.
 *
 * @example
 * <FilterSheetBase open={open} onClose={() => setOpen(false)} sections={sections} onApply={apply} />
 */
export function FilterSheetBase({
  open,
  onClose,
  title = 'Filters',
  sections,
  onApply,
  onReset,
  initialState,
  slots,
  testID,
  id,
}: FilterSheetBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const [filterState, setFilterState] = useState<FilterSheetState>(initialState ?? {})
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (open) {
      opacity.setValue(0)
      translateY.setValue(300)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [open, opacity, translateY])

  const baseTextStyle: TextStyle = { ...sharedTextStyle }
  const baseTestID = testID ?? id ?? 'filter-sheet'

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'card', shadow: 'xl' },
    componentSurface: slots?.panel,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingX: 'md',
      paddingY: 'md',
      border: '1px solid border',
    },
    componentSurface: slots?.header,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'lg', fontWeight: 'semibold', color: 'foreground' },
    componentSurface: slots?.title,
  })
  const closeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { borderRadius: 'full', padding: 'xs' },
    componentSurface: slots?.closeButton,
  })
  const closeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.closeText,
  })
  const scrollContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingY: 'md' },
    componentSurface: slots?.scrollContent,
  })
  const sectionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { marginY: 'sm' },
    componentSurface: slots?.section,
  })
  const sectionLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      color: 'foreground',
      marginY: 'xs',
    },
    componentSurface: slots?.sectionLabel,
  })
  const optionRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'sm',
      paddingY: 'sm',
      states: { selected: { bg: 'accent' } },
    },
    componentSurface: slots?.optionRow,
  })
  const optionIndicatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      border: '2px solid border',
      borderRadius: 'full',
      states: { selected: { bg: 'primary', border: '2px solid primary' } },
    },
    componentSurface: slots?.optionIndicator,
  })
  const optionLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'foreground' },
    componentSurface: slots?.optionLabel,
  })
  const rangeFieldSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'input',
      border: '1px solid border',
      borderRadius: 'md',
      paddingX: 'md',
      paddingY: 'sm',
    },
    componentSurface: slots?.rangeField,
  })
  const rangeSeparatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.rangeSeparator,
  })
  const footerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      gap: 'md',
      paddingX: 'md',
      paddingY: 'md',
      border: '1px solid border',
    },
    componentSurface: slots?.footer,
  })
  const resetButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'md',
      borderRadius: 'md',
      border: '1px solid border',
      bg: 'card',
    },
    componentSurface: slots?.resetButton,
  })
  const resetTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'medium', color: 'foreground' },
    componentSurface: slots?.resetText,
  })
  const applyButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'md',
      borderRadius: 'md',
      bg: 'primary',
    },
    componentSurface: slots?.applyButton,
  })
  const applyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'semibold', color: 'primary-foreground' },
    componentSurface: slots?.applyText,
  })

  const handleSectionChange = useCallback((sectionId: string, value: unknown) => {
    setFilterState((previous) => ({ ...previous, [sectionId]: value }))
  }, [])

  const handleApply = useCallback(() => {
    onApply(filterState)
    onClose()
  }, [filterState, onApply, onClose])

  const handleReset = useCallback(() => {
    setFilterState({})
    onReset?.()
  }, [onReset])

  const renderOptionRow = useCallback(
    (
      section: FilterSheetSection,
      option: { value: string; label: string },
      selected: boolean,
      accessibilityRole: 'radio' | 'checkbox',
      onPress: () => void,
    ) => {
      const activeStates: RuntimeSurfaceState[] | undefined = selected ? ['selected'] : undefined
      const rowStyle = resolveSurfacePresentation({
        tokens,
        implementationBase: optionRowSurface.resolvedConfigForWrapper,
        activeStates,
      }).style as ViewStyle | undefined
      const indicatorStyle = resolveSurfacePresentation({
        tokens,
        implementationBase: optionIndicatorSurface.resolvedConfigForWrapper,
        activeStates,
      }).style as ViewStyle | undefined

      return (
        <TouchableOpacity
          key={option.value}
          onPress={onPress}
          style={rowStyle}
          accessibilityRole={accessibilityRole}
          accessibilityLabel={option.label}
          accessibilityState={{ checked: selected }}
          testID={`${baseTestID}-${section.id}-${option.value}`}
        >
          <View
            style={[
              {
                width: 20,
                height: 20,
                borderRadius: accessibilityRole === 'radio' ? 10 : tokens.radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
              },
              indicatorStyle,
            ]}
          >
            {selected && accessibilityRole === 'checkbox' ? (
              <Text
                style={{
                  ...baseTextStyle,
                  color: tokens.colors.primaryForeground,
                  fontSize: tokens.typography.fontSizeXs,
                }}
              >
                Check
              </Text>
            ) : null}
          </View>
          <Text
            style={{
              ...baseTextStyle,
              flex: 1,
              ...(optionLabelSurface.style as TextStyle | undefined),
            }}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      )
    },
    [
      baseTestID,
      baseTextStyle,
      optionIndicatorSurface.resolvedConfigForWrapper,
      optionLabelSurface.style,
      optionRowSurface.resolvedConfigForWrapper,
      tokens,
    ],
  )

  const renderSection = useCallback(
    (section: FilterSheetSection) => {
      const value = filterState[section.id]

      return (
        <View key={section.id} style={sectionSurface.style as ViewStyle | undefined}>
          {section.type !== 'toggle' ? (
            <Text
              style={{
                ...baseTextStyle,
                ...(sectionLabelSurface.style as TextStyle | undefined),
              }}
            >
              {section.label}
            </Text>
          ) : null}

          {section.type === 'select'
            ? section.options?.map((option) =>
                renderOptionRow(section, option, value === option.value, 'radio', () =>
                  handleSectionChange(section.id, option.value),
                ),
              )
            : null}

          {section.type === 'multi-select'
            ? section.options?.map((option) => {
                const selectedValues = (value as string[] | undefined) ?? []
                const isSelected = selectedValues.includes(option.value)
                return renderOptionRow(section, option, isSelected, 'checkbox', () => {
                  const next = isSelected
                    ? selectedValues.filter((item) => item !== option.value)
                    : [...selectedValues, option.value]
                  handleSectionChange(section.id, next)
                })
              })
            : null}

          {section.type === 'range' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: tokens.spacing[2],
                paddingVertical: tokens.spacing[2],
              }}
            >
              <TouchableOpacity
                style={[{ flex: 1 }, rangeFieldSurface.style as ViewStyle | undefined]}
                accessibilityLabel={`${section.label} minimum`}
                accessibilityRole="adjustable"
                testID={`${baseTestID}-${section.id}-min`}
                onPress={() => {
                  const current = (value as { min?: number } | undefined)?.min ?? section.min ?? 0
                  handleSectionChange(section.id, { ...(value as object), min: current })
                }}
              >
                <Text style={{ ...baseTextStyle, textAlign: 'center' }}>
                  {(value as { min?: number } | undefined)?.min != null
                    ? String((value as { min?: number }).min)
                    : 'Min'}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  ...baseTextStyle,
                  ...(rangeSeparatorSurface.style as TextStyle | undefined),
                }}
              >
                to
              </Text>
              <TouchableOpacity
                style={[{ flex: 1 }, rangeFieldSurface.style as ViewStyle | undefined]}
                accessibilityLabel={`${section.label} maximum`}
                accessibilityRole="adjustable"
                testID={`${baseTestID}-${section.id}-max`}
                onPress={() => {
                  const current = (value as { max?: number } | undefined)?.max ?? section.max ?? 100
                  handleSectionChange(section.id, { ...(value as object), max: current })
                }}
              >
                <Text style={{ ...baseTextStyle, textAlign: 'center' }}>
                  {(value as { max?: number } | undefined)?.max != null
                    ? String((value as { max?: number }).max)
                    : 'Max'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {section.type === 'toggle' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: tokens.spacing[1],
              }}
            >
              <Text
                style={{
                  ...baseTextStyle,
                  ...(optionLabelSurface.style as TextStyle | undefined),
                }}
              >
                {section.label}
              </Text>
              <Switch
                value={Boolean(value)}
                onValueChange={(next) => handleSectionChange(section.id, next)}
                trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
                thumbColor={tokens.colors.surface}
                accessibilityLabel={section.label}
                accessibilityRole="switch"
                accessibilityState={{ checked: Boolean(value) }}
                testID={`${baseTestID}-${section.id}-toggle`}
              />
            </View>
          ) : null}
        </View>
      )
    },
    [
      baseTestID,
      baseTextStyle,
      filterState,
      handleSectionChange,
      optionLabelSurface.style,
      rangeFieldSurface.style,
      rangeSeparatorSurface.style,
      renderOptionRow,
      sectionLabelSurface.style,
      sectionSurface.style,
      tokens.colors.border,
      tokens.colors.primary,
      tokens.colors.surface,
      tokens.spacing,
    ],
  )

  return (
    <RNModal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss filters"
      >
        <Animated.View
          style={[
            { flex: 1, justifyContent: 'flex-end' },
            backdropSurface.style as ViewStyle | undefined,
            { opacity },
          ]}
        >
          <TouchableWithoutFeedback accessible={false}>
            <Animated.View
              style={[
                {
                  borderTopLeftRadius: tokens.radius.xl,
                  borderTopRightRadius: tokens.radius.xl,
                  maxHeight: '85%',
                },
                panelSurface.style as ViewStyle | undefined,
                { transform: [{ translateY }] },
              ]}
            >
              <View style={headerSurface.style as ViewStyle | undefined}>
                <Text
                  style={{
                    ...baseTextStyle,
                    ...(titleSurface.style as TextStyle | undefined),
                  }}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={closeButtonSurface.style as ViewStyle | undefined}
                  accessibilityLabel="Close filters"
                  accessibilityRole="button"
                  testID={`${baseTestID}-close`}
                >
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(closeTextSurface.style as TextStyle | undefined),
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={scrollContentSurface.style as ViewStyle | undefined}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {sections.map(renderSection)}
              </ScrollView>

              <View style={footerSurface.style as ViewStyle | undefined}>
                {onReset ? (
                  <TouchableOpacity
                    onPress={handleReset}
                    style={resetButtonSurface.style as ViewStyle | undefined}
                    accessibilityRole="button"
                    accessibilityLabel="Reset filters"
                    testID={`${baseTestID}-reset`}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        ...baseTextStyle,
                        ...(resetTextSurface.style as TextStyle | undefined),
                      }}
                    >
                      Reset
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={handleApply}
                  style={applyButtonSurface.style as ViewStyle | undefined}
                  accessibilityRole="button"
                  accessibilityLabel="Apply filters"
                  testID={`${baseTestID}-apply`}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      ...baseTextStyle,
                      ...(applyTextSurface.style as TextStyle | undefined),
                    }}
                  >
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  )
}
