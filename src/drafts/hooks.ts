import { useEffect, useState } from 'react'
import type { DurableDraftController } from './controller'
import type { DurableDraftSnapshot } from './types'

export function useDurableDraft<T>(controller: DurableDraftController<T>) {
  const [snapshot, setSnapshot] = useState<DurableDraftSnapshot<T> | null>(null)
  useEffect(() => {
    let mounted = true
    const unsubscribe = controller.subscribe(() => {
      if (mounted) setSnapshot(controller.snapshot)
    })
    void controller.initialize().then(() => {
      if (mounted) setSnapshot(controller.snapshot)
    })
    return () => {
      mounted = false
      unsubscribe()
      void controller.dispose()
    }
  }, [controller])

  return snapshot
}

export function useAutosave<T>(controller: DurableDraftController<T>) {
  const draft = useDurableDraft(controller)
  return {
    isReady: draft !== null,
    isDirty: draft?.isDirty ?? false,
    isSaving: draft?.isSaving ?? false,
    health: draft?.health ?? 'healthy',
    lastSavedAt: draft?.lastSavedAt ?? null,
    lastError: draft?.lastError ?? null,
    flush: () => controller.flush(),
  }
}
