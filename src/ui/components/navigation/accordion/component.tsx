import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { AccordionConfig } from './types'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface SectionRowProps {
  section: AccordionConfig['sections'][number]
  isOpen: boolean
  isLast: boolean
  variant: NonNullable<AccordionConfig['variant']>
  baseTextStyle: TextStyle
  slots?: AccordionConfig['slots']
  onToggle: (id: string) => void
  testIDPrefix?: string
}

function SectionRow({
  section,
  isOpen,
  isLast,
  variant,
  baseTextStyle,
  slots,
  onToggle,
  testIDPrefix,
}: SectionRowProps) {
  const tokens = useTokens()
  const chevronAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [chevronAnim, isOpen])

  const activeStates: RuntimeSurfaceState[] | undefined = isOpen ? ['open'] : undefined

  const sectionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase:
      variant === 'bordered'
        ? {
            bg: 'card',
            border: '1px solid border',
            borderRadius: 'md',
            overflow: 'hidden',
          }
        : variant === 'separated'
          ? {
              bg: 'card',
              borderRadius: 'md',
              shadow: 'sm',
              overflow: 'hidden',
              marginBottom: 'sm',
            }
          : {
              bg: 'card',
            },
    componentSurface: slots?.section as Record<string, unknown> | undefined,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingY: 'md',
      paddingX: 'md',
    },
    componentSurface: slots?.header as Record<string, unknown> | undefined,
  })
  const headerLeftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 'sm',
    },
    componentSurface: slots?.headerLeft as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
    },
    componentSurface: slots?.icon as Record<string, unknown> | undefined,
  })
  const titleBlockSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
    },
    componentSurface: slots?.titleBlock as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'semibold',
      color: 'foreground',
    },
    componentSurface: slots?.title as Record<string, unknown> | undefined,
  })
  const subtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      marginTop: 0,
    },
    componentSurface: slots?.subtitle as Record<string, unknown> | undefined,
  })
  const chevronSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
      marginLeft: 'xs',
    },
    componentSurface: slots?.chevron as Record<string, unknown> | undefined,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'border',
    },
    componentSurface: slots?.divider as Record<string, unknown> | undefined,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingBottom: 'md',
      paddingTop: 'xs',
    },
    componentSurface: slots?.body as Record<string, unknown> | undefined,
  })
  const bodyTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      lineHeight: 'normal',
    },
    componentSurface: slots?.bodyText as Record<string, unknown> | undefined,
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
              style={{
                ...baseTextStyle,
                ...(iconSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
            >
              {section.icon}
            </Text>
          ) : null}
          <View style={titleBlockSurface.style as ViewStyle | undefined}>
            <Text
              style={{
                ...baseTextStyle,
                ...(titleSurface.style as TextStyle | undefined),
              }}
            >
              {section.title}
            </Text>
            {section.subtitle != null ? (
              <Text
                style={{
                  ...baseTextStyle,
                  ...(subtitleSurface.style as TextStyle | undefined),
                }}
              >
                {section.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <Animated.Text
          style={[
            {
              ...baseTextStyle,
              transform: [{ rotate: chevronRotation }],
            },
            chevronSurface.style as TextStyle | undefined,
          ]}
          accessibilityElementsHidden
        >
          {'>'}
        </Animated.Text>
      </TouchableOpacity>

      {isOpen && section.content != null ? (
        <View style={bodySurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...baseTextStyle,
              ...(bodyTextSurface.style as TextStyle | undefined),
            }}
          >
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

export function Accordion({ config }: { config: AccordionConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(config.defaultOpenIds ?? []))

  const variant = config.variant ?? 'default'
  const allowMultiple = config.allowMultiple ?? true
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

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

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      overflow: 'hidden',
      ...(variant === 'bordered'
        ? {
            border: '1px solid border',
            borderRadius: 'md',
          }
        : {}),
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
  })

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
    [allowMultiple, config.onSectionChange, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        {config.sections.map((section, index) => (
          <SectionRow
            key={section.id}
            section={section}
            isOpen={openIds.has(section.id)}
            isLast={index === config.sections.length - 1}
            variant={variant}
            baseTextStyle={baseTextStyle}
            slots={config.slots}
            onToggle={handleToggle}
            testIDPrefix={config.testID ?? config.id}
          />
        ))}
      </View>
    </ComponentWrapper>
  )
}
