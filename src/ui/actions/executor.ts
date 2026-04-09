import { Linking } from 'react-native'
import type { Action } from './types'
import type { ScreenContextValue } from '../context/ScreenContext'
import type { ApiClient } from '../../api/client'
import type { QueryClient } from '@tanstack/react-query'

export interface ActionExecutorDeps {
  screenContext: ScreenContextValue
  api: ApiClient
  queryClient: QueryClient
  router: {
    push(path: string, params?: Record<string, string>): void
    replace(path: string): void
  }
}

/**
 * Executes a config-driven action. All interactive components call this instead
 * of handling actions directly — this is the single dispatch point.
 */
export async function executeAction(action: Action, deps: ActionExecutorDeps): Promise<void> {
  const { screenContext, api, queryClient, router } = deps

  switch (action.type) {
    case 'navigate':
      if (action.replace) {
        router.replace(action.path)
      } else {
        router.push(action.path, action.params)
      }
      break

    case 'api': {
      try {
        let result: unknown
        if (action.method === 'GET') result = await api.get(action.path)
        else if (action.method === 'POST') result = await api.post(action.path, action.body ?? {})
        else if (action.method === 'PUT') result = await api.put(action.path, action.body ?? {})
        else if (action.method === 'PATCH') result = await api.patch(action.path, action.body ?? {})
        else if (action.method === 'DELETE') result = await api.delete(action.path, action.body)
        if (action.resultKey) screenContext.setValue(action.resultKey, result)
        if (action.onSuccess) {
          await executeAction(action.onSuccess, deps)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred'
        if (action.onError) {
          screenContext.setValue('__apiError', message)
          await executeAction(action.onError, deps)
        } else {
          screenContext.setValue('__toast', {
            message,
            variant: 'error',
            duration: 4000,
            id: Date.now(),
          })
        }
      }
      break
    }

    case 'open-bottom-sheet':
      screenContext.setValue(`__sheet_${action.sheetId}`, true)
      break

    case 'close-bottom-sheet':
      screenContext.setValue(`__sheet_${action.sheetId}`, false)
      break

    case 'open-modal':
      screenContext.setValue(`__modal_${action.modalId}`, true)
      break

    case 'close-modal':
      screenContext.setValue(`__modal_${action.modalId}`, false)
      break

    case 'set-value':
      screenContext.setValue(action.key, action.value)
      break

    case 'refresh':
      if (action.queryKey) {
        await queryClient.invalidateQueries({ queryKey: action.queryKey })
      } else {
        await queryClient.invalidateQueries()
      }
      break

    case 'haptic': {
      // Lazy-load haptics to avoid hard dep
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {
          impact,
          notification: notif,
          selection,
        } = require('../../haptics/core') as typeof import('../../haptics/core')
        if (action.selection) selection()
        else if (action.notification) notif(action.notification)
        else impact(action.style ?? 'medium')
      } catch {
        // haptics not available — no-op
      }
      break
    }

    case 'share': {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { share } = require('../../share/index') as typeof import('../../share/index')
        await share({ message: action.message, url: action.url, title: action.title })
      } catch {
        // share not available — no-op
      }
      break
    }

    case 'clipboard': {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { setClipboardString } =
          require('../../share/index') as typeof import('../../share/index')
        await setClipboardString(action.text)
      } catch {
        // clipboard not available — no-op
      }
      break
    }

    case 'open-url':
      await Linking.openURL(action.url)
      break

    case 'toast':
      // Toast state stored in ScreenContext for a ToastContainer to pick up
      screenContext.setValue('__toast', {
        message: action.message,
        variant: action.variant ?? 'info',
        duration: action.duration ?? 3000,
        id: Date.now(),
      })
      break

    case 'action-sheet':
      screenContext.setValue('__actionSheet', action)
      break

    case 'confirm':
      screenContext.setValue('__confirm', action)
      break

    // camera, media-picker, scan-qr: set a pending request; the ScreenRenderer handles these
    case 'camera':
    case 'media-picker':
    case 'scan-qr':
      screenContext.setValue(`__pending_${action.type}`, { ...action, id: Date.now() })
      break

    case 'run-workflow':
      // Workflow dispatch — stored in context for WorkflowRunner to pick up
      screenContext.setValue('__workflow', {
        workflowId: action.workflowId,
        params: action.params,
        id: Date.now(),
      })
      break

    default:
      console.warn('[pocketshot] Unknown action type:', (action as Action).type)
  }
}
