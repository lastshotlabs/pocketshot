import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { KanbanBoardBase, type KanbanBaseColumn, type KanbanBaseItem } from './standalone'
import type { KanbanBoardConfig, KanbanColumn, KanbanItem } from './types'

export function KanbanBoard({ config }: { config: KanbanBoardConfig }) {
  const { dispatch } = useScreenContext()

  const handleCardPress = useCallback(
    async (_item: KanbanBaseItem, _columnId: string) => {
      if (config.onItemPress) {
        await dispatch(config.onItemPress)
      }
    },
    [config.onItemPress, dispatch],
  )

  const handleCardMove = useCallback(
    async (item: KanbanBaseItem, fromColumnId: string) => {
      if (!config.onItemMove) return

      const otherColumns = (config.columns as KanbanColumn[]).filter((c) => c.id !== fromColumnId)
      if (otherColumns.length === 0) return

      await dispatch({
        type: 'action-sheet',
        title: `Move "${item.title}" to...`,
        options: otherColumns.map((col) => ({
          label: col.title,
          action: {
            type: 'set-value',
            target: '__kanban_move',
            value: {
              itemId: item.id,
              fromColumn: fromColumnId,
              toColumn: col.id,
              position: 0,
            },
          },
        })),
      })

      await dispatch(config.onItemMove)
    },
    [config.onItemMove, config.columns, dispatch],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <KanbanBoardBase
        id={config.id}
        testID={config.testID}
        columns={config.columns as KanbanColumn[] as KanbanBaseColumn[]}
        onCardPress={config.onItemPress ? handleCardPress : undefined}
        onCardMove={config.onItemMove ? handleCardMove : undefined}
      />
    </ComponentWrapper>
  )
}

export type { KanbanItem, KanbanColumn }
