import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StyleSheet,
  type LayoutRectangle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TooltipConfig } from './types'

type Position = NonNullable<TooltipConfig['position']>

const ARROW_SIZE = 6

function computeTooltipPosition(
  layout: LayoutRectangle | null,
  position: Position,
): { top?: number; bottom?: number; left?: number; right?: number; alignSelf?: string } {
  if (!layout) return { top: 100, left: 40 }

  const TOOLTIP_WIDTH = 180
  const TOOLTIP_APPROX_HEIGHT = 40
  const MARGIN = 8

  const centerX = layout.x + layout.width / 2
  const left = Math.max(MARGIN, centerX - TOOLTIP_WIDTH / 2)

  switch (position) {
    case 'top':
      return {
        top: layout.y - TOOLTIP_APPROX_HEIGHT - ARROW_SIZE - MARGIN,
        left,
      }
    case 'bottom':
      return {
        top: layout.y + layout.height + ARROW_SIZE + MARGIN,
        left,
      }
    case 'left':
      return {
        top: layout.y + layout.height / 2 - TOOLTIP_APPROX_HEIGHT / 2,
        left: Math.max(MARGIN, layout.x - TOOLTIP_WIDTH - ARROW_SIZE - MARGIN),
      }
    case 'right':
      return {
        top: layout.y + layout.height / 2 - TOOLTIP_APPROX_HEIGHT / 2,
        left: layout.x + layout.width + ARROW_SIZE + MARGIN,
      }
  }
}

function getArrowStyle(
  position: Position,
  tokens: DesignTokens,
): object {
  const arrowBase = {
    width: ARROW_SIZE * 2,
    height: ARROW_SIZE * 2,
    backgroundColor: tokens.colors.text,
    position: 'absolute' as const,
  }

  switch (position) {
    case 'top':
      return {
        ...arrowBase,
        bottom: -ARROW_SIZE,
        alignSelf: 'center' as const,
        transform: [{ rotate: '45deg' }],
      }
    case 'bottom':
      return {
        ...arrowBase,
        top: -ARROW_SIZE,
        alignSelf: 'center' as const,
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

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    trigger: {
      borderBottomWidth: 1,
      borderStyle: 'dotted' as const,
      borderColor: tokens.colors.textMuted,
      alignSelf: 'flex-start',
    },
    triggerText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    backdrop: {
      flex: 1,
    },
    tooltipWrapper: {
      position: 'absolute',
      width: 180,
      alignItems: 'center',
    },
    bubble: {
      backgroundColor: tokens.colors.text,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: tokens.spacing[1],
      maxWidth: 180,
      ...tokens.shadows.sm,
    },
    bubbleText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textInverse,
      lineHeight: tokens.typography.fontSizeXs * tokens.typography.lineHeightNormal,
    },
  })
}

export function Tooltip({ config }: { config: TooltipConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()
  const [visible, setVisible] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null)

  const resolvedTrigger = isFromRef(config.trigger)
    ? String(resolveFromRef(config.trigger, values) ?? '')
    : config.trigger

  const resolvedContent = isFromRef(config.content)
    ? String(resolveFromRef(config.content, values) ?? '')
    : config.content

  const position = config.position ?? 'top'
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const handleTriggerPress = useCallback(() => {
    setVisible((v) => !v)
  }, [])

  const handleBackdropPress = useCallback(() => {
    setVisible(false)
  }, [])

  const tooltipPos = useMemo(
    () => computeTooltipPosition(triggerLayout, position),
    [triggerLayout, position],
  )

  const arrowStyle = useMemo(() => getArrowStyle(position, tokens), [position, tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <TouchableOpacity
        onPress={handleTriggerPress}
        style={styles.trigger}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Tooltip: ${resolvedTrigger}`}
        accessibilityHint="Tap to show tooltip"
        testID={config.testID ? `${config.testID}-trigger` : undefined}
        onLayout={(e) => setTriggerLayout(e.nativeEvent.layout)}
      >
        <Text style={styles.triggerText}>{resolvedTrigger}</Text>
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
          accessibilityLabel="Close tooltip"
          testID={config.testID ? `${config.testID}-backdrop` : undefined}
        >
          <View style={styles.backdrop}>
            <View
              style={[styles.tooltipWrapper, tooltipPos as object]}
              pointerEvents="none"
            >
              {position === 'bottom' ? <View style={arrowStyle} /> : null}
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{resolvedContent}</Text>
              </View>
              {position === 'top' ? <View style={arrowStyle} /> : null}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ComponentWrapper>
  )
}
