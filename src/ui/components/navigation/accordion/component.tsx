import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { AccordionConfig } from './types'

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function makeStyles(tokens: DesignTokens, variant: AccordionConfig['variant']) {
  return StyleSheet.create({
    container: {
      overflow: 'hidden',
    },
    section_default: {
      backgroundColor: tokens.colors.surface,
    },
    section_bordered: {
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.md,
      marginBottom: tokens.spacing[2],
      overflow: 'hidden',
    },
    section_separated: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.md,
      marginBottom: tokens.spacing[3],
      overflow: 'hidden',
      ...tokens.shadows.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[4],
      paddingHorizontal: tokens.spacing[4],
      backgroundColor: tokens.colors.surface,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: tokens.spacing[3],
    },
    icon: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    subtitle: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[0],
    },
    chevron: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      marginLeft: tokens.spacing[2],
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
      marginHorizontal: variant === 'default' ? tokens.spacing[4] : 0,
    },
    body: {
      paddingHorizontal: tokens.spacing[4],
      paddingBottom: tokens.spacing[4],
      paddingTop: tokens.spacing[1],
    },
    bodyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
  })
}

interface SectionRowProps {
  section: AccordionConfig['sections'][number]
  isOpen: boolean
  isLast: boolean
  variant: AccordionConfig['variant']
  styles: ReturnType<typeof makeStyles>
  tokens: DesignTokens
  onToggle: (id: string) => void
  testIDPrefix?: string
}

function SectionRow({
  section,
  isOpen,
  isLast,
  variant,
  styles,
  tokens,
  onToggle,
  testIDPrefix,
}: SectionRowProps) {
  const chevronAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isOpen, chevronAnim])

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  })

  const handlePress = useCallback(() => {
    onToggle(section.id)
  }, [onToggle, section.id])

  const testID = testIDPrefix ? `${testIDPrefix}-${section.id}` : `accordion-${section.id}`

  return (
    <View style={variant === 'default' ? styles.section_default : undefined}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${section.title} section`}
        testID={testID}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {section.icon != null && (
            <Text style={styles.icon} accessibilityElementsHidden>
              {section.icon}
            </Text>
          )}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{section.title}</Text>
            {section.subtitle != null && (
              <Text style={styles.subtitle}>{section.subtitle}</Text>
            )}
          </View>
        </View>
        <Animated.Text
          style={[styles.chevron, { transform: [{ rotate: chevronRotation }] }]}
          accessibilityElementsHidden
        >
          ›
        </Animated.Text>
      </TouchableOpacity>

      {isOpen && section.content != null && (
        <View style={styles.body}>
          <Text style={styles.bodyText}>{section.content}</Text>
        </View>
      )}

      {variant === 'default' && !isLast && <View style={styles.divider} />}
    </View>
  )
}

/**
 * Config-driven accordion component. Renders collapsible sections with
 * animated chevron rotation and LayoutAnimation height transitions.
 *
 * Publishes the toggled section id to ScreenContext under `__pressedSection`
 * before dispatching `onSectionChange`.
 */
export function Accordion({ config }: { config: AccordionConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(config.defaultOpenIds ?? []),
  )

  const variant = config.variant ?? 'default'
  const allowMultiple = config.allowMultiple ?? true
  const styles = useMemo(() => makeStyles(tokens, variant), [tokens, variant])

  const handleToggle = useCallback(
    (sectionId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setOpenIds((prev) => {
        const next = new Set(prev)
        if (next.has(sectionId)) {
          next.delete(sectionId)
        } else {
          if (!allowMultiple) {
            next.clear()
          }
          next.add(sectionId)
        }
        return next
      })
      setValue('__pressedSection', sectionId)
      if (config.onSectionChange) {
        void dispatch(config.onSectionChange)
      }
    },
    [allowMultiple, setValue, dispatch, config.onSectionChange],
  )

  const containerStyle = useMemo(() => {
    if (variant === 'bordered') {
      return [styles.container, { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, overflow: 'hidden' as const }]
    }
    return styles.container
  }, [variant, styles, tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={containerStyle}>
        {config.sections.map((section, index) => {
          const isLast = index === config.sections.length - 1
          const sectionStyle =
            variant === 'bordered'
              ? undefined
              : variant === 'separated'
                ? styles.section_separated
                : undefined

          return (
            <View key={section.id} style={sectionStyle}>
              {variant === 'bordered' && index > 0 && (
                <View style={styles.divider} />
              )}
              <SectionRow
                section={section}
                isOpen={openIds.has(section.id)}
                isLast={isLast}
                variant={variant}
                styles={styles}
                tokens={tokens}
                onToggle={handleToggle}
                testIDPrefix={config.testID ?? config.id}
              />
            </View>
          )
        })}
      </View>
    </ComponentWrapper>
  )
}
