import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal as RNModal,
  ScrollView,
  Switch,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { FilterSheetConfig, FilterSheetSectionConfig } from './types'

type FilterState = Record<string, unknown>

export function FilterSheet({ config }: { config: FilterSheetConfig }) {
  const tokens = useTokens()
  const { getValue, setValue, dispatch } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const isOpen = Boolean(getValue(`__filterSheet_${config.id}`))
  const [filterState, setFilterState] = useState<FilterState>({})
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, opacity, translateY])

  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'rgba(0,0,0,0.55)',
    },
    componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      shadow: 'xl',
    },
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
    },
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const closeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: 'full',
      padding: 'xs',
    },
    componentSurface: config.slots?.closeButton as Record<string, unknown> | undefined,
  })
  const closeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.closeText as Record<string, unknown> | undefined,
  })
  const scrollContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'md',
    },
    componentSurface: config.slots?.scrollContent as Record<string, unknown> | undefined,
  })
  const sectionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      marginY: 'sm',
    },
    componentSurface: config.slots?.section as Record<string, unknown> | undefined,
  })
  const sectionLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      color: 'foreground',
      marginY: 'xs',
    },
    componentSurface: config.slots?.sectionLabel as Record<string, unknown> | undefined,
  })
  const optionRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'sm',
      paddingY: 'sm',
      states: {
        selected: {
          bg: 'accent',
        },
      },
    },
    componentSurface: config.slots?.optionRow as Record<string, unknown> | undefined,
  })
  const optionIndicatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      border: '2px solid border',
      borderRadius: 'full',
      states: {
        selected: {
          bg: 'primary',
          border: '2px solid primary',
        },
      },
    },
    componentSurface: config.slots?.optionIndicator as Record<string, unknown> | undefined,
  })
  const optionLabelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'foreground',
    },
    componentSurface: config.slots?.optionLabel as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.rangeField as Record<string, unknown> | undefined,
  })
  const rangeSeparatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.rangeSeparator as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.footer as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.resetButton as Record<string, unknown> | undefined,
  })
  const resetTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
    },
    componentSurface: config.slots?.resetText as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.applyButton as Record<string, unknown> | undefined,
  })
  const applyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      color: 'primary-foreground',
    },
    componentSurface: config.slots?.applyText as Record<string, unknown> | undefined,
  })

  const title = config.title ?? 'Filters'
  const baseTestID = config.testID ?? config.id

  const handleClose = useCallback(() => {
    setValue(`__filterSheet_${config.id}`, false)
  }, [config.id, setValue])

  const handleSectionChange = useCallback((sectionId: string, value: unknown) => {
    setFilterState((previous) => ({ ...previous, [sectionId]: value }))
  }, [])

  const handleApply = useCallback(async () => {
    if (config.id) {
      setValue(config.id, filterState)
    }
    handleClose()
    await dispatch(config.onApply)
  }, [config.id, config.onApply, dispatch, filterState, handleClose, setValue])

  const handleReset = useCallback(async () => {
    setFilterState({})
    if (config.id) {
      setValue(config.id, {})
    }
    if (config.onReset) {
      await dispatch(config.onReset)
    }
  }, [config.id, config.onReset, dispatch, setValue])

  const renderOptionRow = useCallback(
    (
      section: FilterSheetSectionConfig,
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
    (section: FilterSheetSectionConfig) => {
      const value = filterState[section.id]

      return (
        <View
          key={section.id}
          style={sectionSurface.style as ViewStyle | undefined}
        >
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
                renderOptionRow(
                  section,
                  option,
                  value === option.value,
                  'radio',
                  () => handleSectionChange(section.id, option.value),
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
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <RNModal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Dismiss filters">
          <Animated.View
            style={[
              { flex: 1, justifyContent: 'flex-end' },
              backdropSurface.style as ViewStyle | undefined,
              { opacity },
            ]}
          >
            <TouchableWithoutFeedback>
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
                    onPress={handleClose}
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
                  {config.sections.map(renderSection)}
                </ScrollView>

                <View style={footerSurface.style as ViewStyle | undefined}>
                  {config.onReset ? (
                    <TouchableOpacity
                      onPress={() => void handleReset()}
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
                    onPress={() => void handleApply()}
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
    </ComponentWrapper>
  )
}
