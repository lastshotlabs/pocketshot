import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TagSelectorConfig, TagDefinition } from './types'

export function TagSelector({ config }: { config: TagSelectorConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null
      ? (resolveFromRef(config.value, values) as string[] | undefined)
      : undefined

  const [selectedIds, setSelectedIds] = useState<string[]>(
    resolvedValue ?? config.defaultValue ?? [],
  )

  useEffect(() => {
    if (resolvedValue != null) {
      setSelectedIds(resolvedValue)
    }
  }, [resolvedValue])

  const atLimit = config.maxTags != null && selectedIds.length >= config.maxTags

  const handleTagPress = useCallback(
    (tagId: string) => {
      const isSelected = selectedIds.includes(tagId)
      if (!isSelected && atLimit) return
      const newIds = isSelected
        ? selectedIds.filter((id) => id !== tagId)
        : [...selectedIds, tagId]
      setSelectedIds(newIds)
      setValue(config.id, newIds)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [selectedIds, atLimit, config.id, config.onChangeAction, setValue, dispatch],
  )

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <View style={styles.tagsRow}>
          {config.availableTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={selectedIds.includes(tag.id)}
              dimmed={!selectedIds.includes(tag.id) && atLimit}
              onPress={handleTagPress}
              tokens={tokens}
              styles={styles}
              componentId={config.id}
            />
          ))}
        </View>
      </View>
    </ComponentWrapper>
  )
}

interface TagChipProps {
  tag: TagDefinition
  selected: boolean
  dimmed: boolean
  onPress: (id: string) => void
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  componentId: string
}

function TagChip({ tag, selected, dimmed, onPress, tokens, styles, componentId }: TagChipProps) {
  const handlePress = useCallback(() => {
    onPress(tag.id)
  }, [tag.id, onPress])

  const backgroundColor = selected
    ? (tag.color ?? tokens.colors.primary)
    : tokens.colors.surfaceAlt
  const textColor = selected
    ? tag.color
      ? tokens.colors.primaryForeground
      : tokens.colors.primaryForeground
    : tokens.colors.textMuted
  const borderColor = selected ? (tag.color ?? tokens.colors.primary) : tokens.colors.border

  return (
    <TouchableOpacity
      style={[
        styles.tag,
        { backgroundColor, borderColor },
        dimmed && styles.tagDimmed,
      ]}
      onPress={handlePress}
      disabled={dimmed}
      accessibilityRole="checkbox"
      accessibilityLabel={tag.label}
      accessibilityState={{ checked: selected, disabled: dimmed }}
      testID={`${componentId}-tag-${tag.id}`}
    >
      <Text style={[styles.tagText, { color: textColor }]}>{tag.label}</Text>
    </TouchableOpacity>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[2],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing[2],
    },
    tag: {
      borderRadius: tokens.radius.full,
      paddingVertical: 5,
      paddingHorizontal: tokens.spacing[2] + 2,
      borderWidth: 1,
    },
    tagDimmed: {
      opacity: 0.4,
    },
    tagText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}

