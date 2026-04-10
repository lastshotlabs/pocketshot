import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ReactionBarConfig, ReactionItem } from './types'

// ── Reaction Pill ─────────────────────────────────────────────────────────────

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
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1.1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1.0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
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

// ── ReactionBar ───────────────────────────────────────────────────────────────

export function ReactionBar({ config }: { config: ReactionBarConfig }) {
  const tokens = useTokens()
  const { values, dispatch, setValue } = useScreenContext()

  const rawReactions = resolveFromRef(config.reactions, values) as ReactionItem[]
  const [localReactions, setLocalReactions] = useState<ReactionItem[]>(() =>
    (rawReactions ?? []).map((r) => ({ ...r, reacted: r.reacted ?? false })),
  )

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const displayed = useMemo(
    () => localReactions.slice(0, config.maxDisplay),
    [localReactions, config.maxDisplay],
  )
  const overflow = localReactions.length - config.maxDisplay

  const handlePress = useCallback(
    (reaction: ReactionItem) => {
      const updated = localReactions.map((r) => {
        if (r.emoji !== reaction.emoji) return r
        const nowReacted = !r.reacted
        return {
          ...r,
          reacted: nowReacted,
          count: nowReacted ? r.count + 1 : Math.max(0, r.count - 1),
        }
      })
      setLocalReactions(updated)
      const updatedReaction = updated.find((r) => r.emoji === reaction.emoji)!
      setValue('__reaction', updatedReaction)
      if (config.onReactAction) {
        void dispatch(config.onReactAction)
      }
    },
    [localReactions, setValue, dispatch, config.onReactAction],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        testID={config.testID ? `${config.testID}-scroll` : undefined}
      >
        {displayed.map((reaction, idx) => (
          <ReactionPill
            key={reaction.emoji}
            reaction={reaction}
            onPress={handlePress}
            tokens={tokens}
            styles={styles}
            testID={config.testID ? `${config.testID}-reaction-${idx}` : undefined}
          />
        ))}
        {overflow > 0 && (
          <View style={styles.overflowChip}>
            <Text style={styles.overflowText}>+{overflow} more</Text>
          </View>
        )}
      </ScrollView>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
