import React, { useCallback, useEffect, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ActionSheetBase, type ActionSheetOption } from './standalone'
import type { ActionSheetConfig, ActionSheetPayload } from './types'

export function ActionSheet({ config }: { config: ActionSheetConfig }) {
  const { getValue, setValue, dispatch } = useScreenContext()
  const sheetPayload = getValue('__actionSheet') as ActionSheetPayload | undefined
  const [activeSheet, setActiveSheet] = useState<ActionSheetPayload | null>(null)

  useEffect(() => {
    if (sheetPayload) setActiveSheet(sheetPayload)
  }, [sheetPayload])

  const handleClose = useCallback(() => {
    setValue('__actionSheet', null)
    setActiveSheet(null)
  }, [setValue])

  const options: ActionSheetOption[] =
    activeSheet?.options.map((option) => ({
      label: option.label,
      destructive: option.destructive,
      onPress: () => {
        void dispatch(option.action)
      },
    })) ?? []

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeSheet ? ['open'] : undefined}
    >
      <ActionSheetBase
        id={config.id}
        testID={config.testID}
        visible={activeSheet != null}
        onClose={handleClose}
        title={activeSheet?.title}
        options={options}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
