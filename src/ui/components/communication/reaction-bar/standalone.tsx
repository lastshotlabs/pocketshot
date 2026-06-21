import React, { useCallback, useMemo, useRef } from 'react'
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface ReactionItem {
  emoji: string
  label: string
  count: number
  reacted: boolean
}

export interface ReactionBarBaseProps {
  /** Reactions to render. */
  reactions: ReactionItem[]
  /** Maximum reactions to display before overflow. */
  maxDisplay?: number
  /** Called when a reaction pill is tapped. */
  onReact?: (reaction: ReactionItem) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

interface ReactionPillProps {
  reaction: ReactionItem
  onPress: (reaction: ReactionItem) => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  testID?: string
}

function ReactionPill({ reaction, onPress, tokens, styles, testID }: ReactionPillProps) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1.0, useNativeDriver: true, speed: 50, bounciness: 0 }),
    ]).start()
    onPress(reaction)
  }, [onPress, reaction, scale])

  const pillStyle = reaction.reacted ? styles.pillReacted : styles.pillDefault

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={pillStyle}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="togglebutton"
        accessibilityLabel={`React with ${reaction.label}, ${reaction.count} reactions`}
        accessibilityState={{ checked: reaction.reacted }}
        testID={testID ?? `reaction-${reaction.emoji}`}
      >
        <Text style={styles.emoji}>{reaction.emoji}</Text>
        <Text
          style={[
            styles.count,
            { color: reaction.reacted ? tokens.colors.primary : tokens.colors.textMuted },
          ]}
        >
          {reaction.count}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

/**
 * Standalone ReactionBar — plain React props, no manifest required.
 *
 * @example
 * <ReactionBarBase reactions={[{ emoji: '👍', label: 'thumbs up', count: 3, reacted: false }]} />
 */
export function ReactionBarBase({
  reactions,
  maxDisplay = 6,
  onReact,
  style,
  testID,
  id,
}: ReactionBarBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const displayed = reactions.slice(0, maxDisplay)
  const overflow = reactions.length - maxDisplay

  const handlePress = useCallback(
    (reaction: ReactionItem) => {
      onReact?.(reaction)
    },
    [onReact],
  )

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
      testID={testID ? `${testID}-scroll` : id}
    >
      {displayed.map((reaction, idx) => (
        <ReactionPill
          key={reaction.emoji}
          reaction={reaction}
          onPress={handlePress}
          tokens={tokens}
          styles={styles}
          testID={testID ? `${testID}-reaction-${idx}` : undefined}
        />
      ))}
      {overflow > 0 && (
        <View style={styles.overflowChip}>
          <Text style={styles.overflowText}>+{overflow} more</Text>
        </View>
      )}
    </ScrollView>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[1],
      gap: tokens.spacing[1],
    },
    pillDefault: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surfaceAlt,
      borderColor: tokens.colors.border,
      borderWidth: 1,
      borderRadius: tokens.radius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    pillReacted: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.primary + '1a',
      borderColor: tokens.colors.primary,
      borderWidth: 1,
      borderRadius: tokens.radius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    emoji: {
      fontSize: tokens.typography.fontSizeMd,
      marginRight: tokens.spacing[1],
    },
    count: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    overflowChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surfaceAlt,
      borderColor: tokens.colors.border,
      borderWidth: 1,
      borderRadius: tokens.radius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    overflowText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}
