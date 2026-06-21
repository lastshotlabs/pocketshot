import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export type AccordionVariant = 'default' | 'bordered' | 'separated'

export interface AccordionSection {
  id: string
  title: string
  subtitle?: string
  icon?: string
  content?: string
}

export interface AccordionBaseProps {
  sections: AccordionSection[]
  /** IDs initially open. */
  defaultOpenIds?: string[]
  /** Allow multiple sections open at once. Default true. */
  allowMultiple?: boolean
  /** Visual variant. */
  variant?: AccordionVariant
  /** Called when a section is opened or closed. Receives id and new open state. */
  onSectionChange?: (id: string, open: boolean) => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

interface SectionRowProps {
  section: AccordionSection
  isOpen: boolean
  isLast: boolean
  variant: AccordionVariant
  slots?: Record<string, Record<string, unknown>>
  onToggle: (id: string) => void
  testIDPrefix?: string
}

function SectionRow({
  section,
  isOpen,
  isLast,
  variant,
  slots,
  onToggle,
  testIDPrefix,
}: SectionRowProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const chevronAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [chevronAnim, isOpen])

  const _activeStates: RuntimeSurfaceState[] | undefined = isOpen ? ['open'] : undefined
  void _activeStates

  const sectionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase:
      variant === 'bordered'
        ? { bg: 'card', border: '1px solid border', borderRadius: 'md', overflow: 'hidden' }
        : variant === 'separated'
          ? {
              bg: 'card',
              borderRadius: 'md',
              shadow: 'sm',
              overflow: 'hidden',
              marginBottom: 'sm',
            }
          : { bg: 'card' },
    componentSurface: slots?.section,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingY: 'md',
      paddingX: 'md',
    },
    componentSurface: slots?.header,
  })
  const headerLeftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 'sm' },
    componentSurface: slots?.headerLeft,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'muted' },
    componentSurface: slots?.icon,
  })
  const titleBlockSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.titleBlock,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', fontWeight: 'semibold', color: 'foreground' },
    componentSurface: slots?.title,
  })
  const subtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', marginTop: 0 },
    componentSurface: slots?.subtitle,
  })
  const chevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'muted', marginLeft: 'xs' },
    componentSurface: slots?.chevron,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'border' },
    componentSurface: slots?.divider,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md', paddingBottom: 'md', paddingTop: 'xs' },
    componentSurface: slots?.body,
  })
  const bodyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', lineHeight: 'normal' },
    componentSurface: slots?.bodyText,
  })

  const testID = testIDPrefix ? `${testIDPrefix}-${section.id}` : `accordion-${section.id}`
  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  })

  return (
    <View style={sectionSurface.style as ViewStyle | undefined}>
      <TouchableOpacity
        onPress={() => onToggle(section.id)}
        style={headerSurface.style as ViewStyle | undefined}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${section.title} section`}
        testID={testID}
        activeOpacity={0.7}
      >
        <View style={headerLeftSurface.style as ViewStyle | undefined}>
          {section.icon != null ? (
            <Text
              style={{ ...sharedTextStyle, ...(iconSurface.style as TextStyle | undefined) }}
              accessibilityElementsHidden
            >
              {section.icon}
            </Text>
          ) : null}
          <View style={titleBlockSurface.style as ViewStyle | undefined}>
            <Text style={{ ...sharedTextStyle, ...(titleSurface.style as TextStyle | undefined) }}>
              {section.title}
            </Text>
            {section.subtitle != null ? (
              <Text
                style={{ ...sharedTextStyle, ...(subtitleSurface.style as TextStyle | undefined) }}
              >
                {section.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <Animated.Text
          style={[
            { ...sharedTextStyle, transform: [{ rotate: chevronRotation }] },
            chevronSurface.style as TextStyle | undefined,
          ]}
          accessibilityElementsHidden
        >
          {'>'}
        </Animated.Text>
      </TouchableOpacity>
      {isOpen && section.content != null ? (
        <View style={bodySurface.style as ViewStyle | undefined}>
          <Text style={{ ...sharedTextStyle, ...(bodyTextSurface.style as TextStyle | undefined) }}>
            {section.content}
          </Text>
        </View>
      ) : null}
      {variant === 'default' && !isLast ? (
        <View
          style={[
            { height: 1, marginHorizontal: tokens.spacing[4] },
            dividerSurface.style as ViewStyle | undefined,
          ]}
        />
      ) : null}
    </View>
  )
}

/**
 * Standalone Accordion — plain React props, no manifest required.
 *
 * @example
 * <AccordionBase sections={[{ id: '1', title: 'Foo', content: 'Bar' }]} />
 */
export function AccordionBase({
  sections,
  defaultOpenIds,
  allowMultiple = true,
  variant = 'default',
  onSectionChange,
  style,
  slots,
  testID,
  id,
}: AccordionBaseProps) {
  const tokens = useTokens()
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultOpenIds ?? []))

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      overflow: 'hidden',
      ...(variant === 'bordered' ? { border: '1px solid border', borderRadius: 'md' } : {}),
    },
    componentSurface: slots?.container,
  })

  const handleToggle = useCallback(
    (sectionId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setOpenIds((prev) => {
        const next = new Set(prev)
        const wasOpen = next.has(sectionId)
        if (wasOpen) next.delete(sectionId)
        else {
          if (!allowMultiple) next.clear()
          next.add(sectionId)
        }
        onSectionChange?.(sectionId, !wasOpen)
        return next
      })
    },
    [allowMultiple, onSectionChange],
  )

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]} testID={testID ?? id}>
      {sections.map((section, index) => (
        <SectionRow
          key={section.id}
          section={section}
          isOpen={openIds.has(section.id)}
          isLast={index === sections.length - 1}
          variant={variant}
          slots={slots}
          onToggle={handleToggle}
          testIDPrefix={testID ?? id}
        />
      ))}
    </View>
  )
}
