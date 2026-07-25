import React, { useEffect, useMemo, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { FileUploaderBase } from './standalone'
import type { FileUploaderConfig, FileItem } from './types'

export function FileUploader({ config }: { config: FileUploaderConfig }) {
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedLabel =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const resolvedInitial = config.value != null ? resolveFromRef(config.value, values) : undefined
  const initialUris = useMemo(
    () => (Array.isArray(resolvedInitial) ? (resolvedInitial as string[]) : []),
    [resolvedInitial],
  )

  const [files, setFiles] = useState<FileItem[]>(() =>
    initialUris.map((uri) => ({
      uri,
      name: uri.split('/').pop() ?? uri,
    })),
  )

  useEffect(() => {
    setFiles(
      initialUris.map((uri) => ({
        uri,
        name: uri.split('/').pop() ?? uri,
      })),
    )
  }, [initialUris])

  const handleChange = (next: FileItem[]) => {
    setFiles(next)
    setValue(
      config.id,
      next.map((f) => f.uri),
    )
    if (config.onChangeAction != null) {
      void dispatch(config.onChangeAction)
    }
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FileUploaderBase
        label={resolvedLabel}
        accept={config.accept}
        multiple={config.multiple}
        maxFiles={config.maxFiles}
        maxSizeMb={config.maxSizeMb}
        value={files}
        onChange={handleChange}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
