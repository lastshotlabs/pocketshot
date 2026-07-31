import React, { useCallback, useMemo, useState } from 'react'
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type LayoutRectangle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipBaseProps {
  /** The visible trigger text. */
  trigger: string
  /** Tooltip body content. */
  content: string
  /** Where to anchor the tooltip relative to the trigger. */
  position?: TooltipPosition
  /** Slot overrides (root, content, arrow). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

const ARROW_SIZE = 6

function computeTooltipPosition(
  layout: LayoutRectangle | null,
  position: TooltipPosition,
): { top?: number; left?: number } {
  if (!layout) return { top: 100, left: 40 }

  const tooltipWidth = 180
  const tooltipApproxHeight = 40
  const margin = 8

  const centerX = layout.x + layout.width / 2
  const left = Math.max(margin, centerX - tooltipWidth / 2)

  switch (position) {
    case 'top':
      return { top: layout.y - tooltipApproxHeight - ARROW_SIZE - margin, left }
    case 'bottom':
      return { top: layout.y + layout.height + ARROW_SIZE + margin, left }
    case 'left':
      return {
        top: layout.y + layout.height / 2 - tooltipApproxHeight / 2,
        left: Math.max(margin, layout.x - tooltipWidth - ARROW_SIZE - margin),
      }
    case 'right':
      return {
        top: layout.y + layout.height / 2 - tooltipApproxHeight / 2,
        left: layout.x + layout.width + ARROW_SIZE + margin,
      }
  }
}

function getArrowStyle(position: TooltipPosition, tokens: DesignTokens): ViewStyle {
  const arrowBase: ViewStyle = {
    width: ARROW_SIZE * 2,
    height: ARROW_SIZE * 2,
    backgroundColor: tokens.colors.text,
    position: 'absolute',
  }

  switch (position) {
    case 'top':
      return {
        ...arrowBase,
        bottom: -ARROW_SIZE,
        alignSelf: 'center',
        transform: [{ rotate: '45deg' }],
      }
    case 'bottom':
      return {
        ...arrowBase,
        top: -ARROW_SIZE,
        alignSelf: 'center',
        transform: [{ rotate: '45deg' }],
      }
    case 'left':
      return {
        ...arrowBase,
        right: -ARROW_SIZE,
        top: '50%' as unknown as number,
        transform: [{ rotate: '45deg' }],
      }
    case 'right':
      return {
        ...arrowBase,
        left: -ARROW_SIZE,
        top: '50%' as unknown as number,
        transform: [{ rotate: '45deg' }],
      }
  }
}

/**
 * Standalone Tooltip — plain React props, no manifest required.
 *
 * @example
 * <TooltipBase trigger="hover me" content="Helpful info" position="top" />
 */
export function TooltipBase({
  trigger,
  content,
  position = 'top',
  slots,
  style,
  testID,
}: TooltipBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [visible, setVisible] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null)

  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const contentSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.content })
  const arrowSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.arrow })

  const handleTriggerPress = useCallback(() => setVisible((v) => !v), [])
  const handleBackdropPress = useCallback(() => setVisible(false), [])

  const tooltipPos = useMemo(
    () => computeTooltipPosition(triggerLayout, position),
    [triggerLayout, position],
  )

  const arrowStyle = useMemo(() => getArrowStyle(position, tokens), [position, tokens])

  const triggerStyle: ViewStyle = {
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: tokens.colors.textMuted,
    alignSelf: 'flex-start',
    ...style,
  }
  const triggerTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.text,
  }
  const bubbleStyle: ViewStyle = {
    backgroundColor: tokens.colors.text,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    maxWidth: 180,
    ...tokens.shadows.sm,
  }
  const bubbleTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeXs,
    color: tokens.colors.textInverse,
    lineHeight: tokens.typography.fontSizeXs * tokens.typography.lineHeightNormal,
  }
  const tooltipWrapperStyle: ViewStyle = {
    position: 'absolute',
    width: 180,
    alignItems: 'center',
  }

  return (
    <>
      <TouchableOpacity
        onPress={handleTriggerPress}
        style={[triggerStyle, rootSurface.style as ViewStyle | undefined]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Tooltip: ${trigger}`}
        accessibilityHint="Tap to show tooltip"
        testID={testID ? `${testID}-trigger` : undefined}
        onLayout={(e) => setTriggerLayout(e.nativeEvent.layout)}
      >
        <Text style={triggerTextStyle}>{trigger}</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleBackdropPress}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Close tooltip"
          testID={testID ? `${testID}-backdrop` : undefined}
        >
          <View style={{ flex: 1 }}>
            <View style={[tooltipWrapperStyle, tooltipPos as ViewStyle]} pointerEvents="none">
              {position === 'bottom' ? (
                <View style={[arrowStyle, arrowSurface.style as ViewStyle | undefined]} />
              ) : null}
              <View style={[bubbleStyle, contentSurface.style as ViewStyle | undefined]}>
                <Text style={bubbleTextStyle}>{content}</Text>
              </View>
              {position === 'top' ? (
                <View style={[arrowStyle, arrowSurface.style as ViewStyle | undefined]} />
              ) : null}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  )
}
