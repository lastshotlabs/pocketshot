import {
  ACTION_TYPES as SHARED_ACTION_TYPES,
  type ActionConfig as SharedAction,
} from '@lastshotlabs/frontend-contract/actions'
import type { ResourceMap } from '@lastshotlabs/frontend-contract/resources'
import type { ThemeConfig } from '@lastshotlabs/frontend-contract/tokens'
import type { WorkflowMap } from '@lastshotlabs/frontend-contract/workflows'
import { Linking } from 'react-native'
import type { QueryClient } from '@tanstack/react-query'
import {
  invalidateManifestRefreshTarget,
  invalidateManifestResource,
  resolveManifestResourceTarget,
} from '../manifest/resources'
import { resolveRuntimeTemplate, resolveRuntimeValue } from '../runtime/resolve'
import { runWorkflow } from '../workflows'
import type { ScreenContextValue } from '../context/ScreenContext'
import type { Action, ActionSequence, ShareAction } from './types'

const sharedActionTypeSet = new Set<string>(SHARED_ACTION_TYPES)

interface ActionExecutorApi {
  get(path: string): Promise<unknown>
  post(path: string, body?: unknown): Promise<unknown>
  put(path: string, body?: unknown): Promise<unknown>
  patch(path: string, body?: unknown): Promise<unknown>
  delete(path: string, body?: unknown): Promise<unknown>
}

export interface ActionExecutorDeps {
  screenContext: ScreenContextValue
  api: ActionExecutorApi
  queryClient: Pick<QueryClient, 'invalidateQueries'>
  resources?: ResourceMap
  workflows?: WorkflowMap
  setTheme?: (next: Partial<Pick<ThemeConfig, 'mode' | 'flavor'>>) => void
  router: {
    push(path: string, params?: Record<string, string>): void
    replace(path: string): void
  }
}

export async function executeAction(
  action: ActionSequence,
  deps: ActionExecutorDeps,
  context: Record<string, unknown> = {},
): Promise<void> {
  await executeActionInternal(action, deps, context)
}

async function executeActionInternal(
  action: ActionSequence,
  deps: ActionExecutorDeps,
  context: Record<string, unknown>,
): Promise<unknown> {
  if (Array.isArray(action)) {
    let lastResult: unknown
    for (const nextAction of action) {
      lastResult = await executeActionInternal(nextAction, deps, context)
    }
    return lastResult
  }

  if (isSharedAction(action)) {
    let lastResult: unknown
    await runWorkflow(action, {
      workflows: deps.workflows,
      context,
      resolveValue: (value, nextContext) =>
        resolveRuntimeValue(value, {
          values: deps.screenContext.values,
          context: nextContext,
        }),
      executeAction: async (builtin, nextContext) => {
        lastResult = await executeBuiltinAction(builtin, deps, nextContext)
        return lastResult
      },
    })
    return lastResult
  }

  return executeBuiltinAction(action, deps, context)
}

async function executeBuiltinAction(
  action: Action,
  deps: ActionExecutorDeps,
  context: Record<string, unknown>,
): Promise<unknown> {
  const { api, queryClient, resources, router, screenContext, setTheme } = deps

  switch (action.type) {
    case 'navigate': {
      const to = resolveText(action.to, deps, context)
      if (action.replace) {
        router.replace(to)
      } else {
        router.push(to)
      }
      return to
    }

    case 'navigate-external': {
      const to = resolveText(action.to, deps, context)
      await Linking.openURL(to)
      return to
    }

    case 'api': {
      const target = resolveRuntimeValue(action.endpoint, {
        values: screenContext.values,
        context,
      }) as Parameters<typeof resolveManifestResourceTarget>[0]
      const params = action.params
        ? (resolveRuntimeValue(action.params, {
            values: screenContext.values,
            context,
          }) as Record<string, unknown>)
        : undefined
      const { request, resourceName, url } = resolveManifestResourceTarget(
        target,
        resources,
        params,
        action.method,
      )
      const body =
        action.body === undefined
          ? undefined
          : resolveRuntimeValue(action.body, {
              values: screenContext.values,
              context,
            })

      try {
        let result: unknown
        switch (request.method) {
          case 'GET':
            result = await api.get(url)
            break
          case 'POST':
            result = await api.post(url, body ?? {})
            break
          case 'PUT':
            result = await api.put(url, body ?? {})
            break
          case 'PATCH':
            result = await api.patch(url, body ?? {})
            break
          case 'DELETE':
            result = await api.delete(url, body)
            break
        }

        if (resourceName) {
          await invalidateManifestResource(queryClient, resourceName, resources)
        }
        for (const targetName of action.invalidates ?? []) {
          await invalidateManifestResource(queryClient, targetName, resources)
        }

        if (action.onSuccess) {
          await executeActionInternal(action.onSuccess as ActionSequence, deps, {
            ...context,
            result,
          })
        }
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred'
        screenContext.setValue('__apiError', message)

        if (action.onError) {
          await executeActionInternal(action.onError as ActionSequence, deps, {
            ...context,
            error: err,
          })
          return undefined
        }

        screenContext.setValue('__toast', {
          message,
          variant: 'error',
          duration: 4000,
          id: Date.now(),
        })
        return undefined
      }
    }

    case 'open-modal': {
      screenContext.setValue(`__modal_${action.modal}`, {
        open: true,
        payload:
          action.payload === undefined
            ? undefined
            : resolveRuntimeValue(action.payload, {
                values: screenContext.values,
                context,
              }),
        resultTarget: action.resultTarget,
      })
      return action.modal
    }

    case 'close-modal': {
      const modalId = action.modal ?? 'default'
      const result =
        action.result === undefined
          ? undefined
          : resolveRuntimeValue(action.result, {
              values: screenContext.values,
              context,
            })
      screenContext.setValue(`__modal_${modalId}`, {
        open: false,
        result,
      })
      if (action.modal == null) {
        screenContext.setValue('__modal', {
          open: false,
          result,
        })
      }
      return result
    }

    case 'refresh': {
      await invalidateManifestRefreshTarget(queryClient, action.target, resources)

      for (const target of splitTargets(action.target)) {
        if (!target.startsWith('resource:')) {
          screenContext.setValue(`__refresh_${target}`, Date.now())
        }
      }
      return action.target
    }

    case 'set-value': {
      const value = resolveRuntimeValue(action.value, {
        values: screenContext.values,
        context,
      })
      screenContext.setValue(action.target, value)
      return value
    }

    case 'download': {
      const target = resolveRuntimeValue(action.endpoint, {
        values: screenContext.values,
        context,
      }) as Parameters<typeof resolveManifestResourceTarget>[0]
      const { url } = resolveManifestResourceTarget(target, resources)
      const payload = {
        url,
        filename: action.filename,
        id: Date.now(),
      }
      screenContext.setValue('__download', payload)
      return payload
    }

    case 'copy': {
      const text = resolveText(action.text, deps, context)
      await writeClipboard(text)
      if (action.onSuccess) {
        await executeActionInternal(action.onSuccess as ActionSequence, deps, {
          ...context,
          text,
        })
      }
      return text
    }

    case 'copy-to-clipboard': {
      const text = resolveText(action.text, deps, context)
      await writeClipboard(text)
      if (action.toast) {
        screenContext.setValue('__toast', {
          message: resolveText(action.toast, deps, {
            ...context,
            text,
          }),
          variant: 'success',
          duration: 3000,
          id: Date.now(),
        })
      }
      return text
    }

    case 'emit': {
      const event = resolveText(action.event, deps, context)
      const payload =
        action.payload === undefined
          ? undefined
          : resolveRuntimeValue(action.payload, {
              values: screenContext.values,
              context,
            })
      screenContext.setValue(`__event_${event}`, payload)
      screenContext.setValue('__event', { event, payload, id: Date.now() })
      return payload
    }

    case 'submit-form':
      screenContext.setValue(`__submitForm_${action.formId}`, Date.now())
      screenContext.setValue('__submitForm', { formId: action.formId, id: Date.now() })
      return action.formId

    case 'reset-form':
      screenContext.setValue(`__resetForm_${action.formId}`, Date.now())
      screenContext.setValue('__resetForm', { formId: action.formId, id: Date.now() })
      return action.formId

    case 'set-theme':
      setTheme?.({
        ...(action.flavor ? { flavor: action.flavor } : {}),
        ...(action.mode ? { mode: action.mode } : {}),
      })
      return action

    case 'confirm': {
      const payload = {
        ...action,
        title: action.title ? resolveText(action.title, deps, context) : undefined,
        description: action.description
          ? resolveText(action.description, deps, context)
          : undefined,
        message: action.message ? resolveText(action.message, deps, context) : undefined,
        id: Date.now(),
      }
      screenContext.setValue('__confirm', payload)
      return payload
    }

    case 'scroll-to': {
      const payload = {
        ...action,
        target: resolveText(action.target, deps, context),
        id: Date.now(),
      }
      screenContext.setValue('__scrollTo', payload)
      return payload.target
    }

    case 'toast': {
      const payload = {
        message: resolveText(action.message, deps, context),
        variant: action.variant ?? 'info',
        duration: action.duration ?? 3000,
        id: Date.now(),
      }
      screenContext.setValue('__toast', payload)
      return payload.message
    }

    case 'log': {
      const message = resolveText(action.message, deps, context)
      const data =
        action.data === undefined
          ? undefined
          : (resolveRuntimeValue(action.data, {
              values: screenContext.values,
              context,
            }) as Record<string, unknown>)
      const logger =
        action.level === 'debug'
          ? console.debug
          : action.level === 'warn'
            ? console.warn
            : action.level === 'error'
              ? console.error
              : console.info
      logger(message, data)
      return message
    }

    case 'track': {
      const payload = {
        event: resolveText(action.event, deps, context),
        props:
          action.props === undefined
            ? undefined
            : resolveRuntimeValue(action.props, {
                values: screenContext.values,
                context,
              }),
        id: Date.now(),
      }
      screenContext.setValue('__track', payload)
      return payload
    }

    case 'ws-send': {
      const payload = {
        event: resolveText(action.event, deps, context),
        data:
          action.data === undefined
            ? undefined
            : resolveRuntimeValue(action.data, {
                values: screenContext.values,
                context,
              }),
        id: Date.now(),
      }
      screenContext.setValue('__wsSend', payload)
      return payload
    }

    case 'open-bottom-sheet':
      screenContext.setValue(`__sheet_${action.sheet}`, {
        open: true,
        payload: action.payload,
      })
      return action.sheet

    case 'close-bottom-sheet': {
      const payload = {
        open: false,
        result: action.result,
      }
      if (action.sheet) {
        screenContext.setValue(`__sheet_${action.sheet}`, payload)
      }
      screenContext.setValue('__sheet', payload)
      return action.result
    }

    case 'action-sheet':
      screenContext.setValue('__actionSheet', action)
      return action.title

    case 'haptic': {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {
          impact,
          notification: notify,
          selection,
        } = require('../../haptics/core') as typeof import('../../haptics/core')
        if (action.selection) selection()
        else if (action.notification) notify(action.notification)
        else impact(action.style ?? 'medium')
      } catch {
        // haptics are optional in this package boundary
      }
      return undefined
    }

    case 'share': {
      const payload = resolveShareAction(action, deps, context)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { share } = require('../../share/index') as typeof import('../../share/index')
        await share(payload)
      } catch {
        // sharing is optional in this package boundary
      }
      return payload
    }

    case 'clipboard': {
      const text = resolveText(action.text, deps, context)
      await writeClipboard(text)
      return text
    }

    case 'open-url': {
      const url = resolveText(action.url, deps, context)
      await Linking.openURL(url)
      return url
    }

    case 'camera':
    case 'media-picker':
    case 'scan-qr': {
      const payload = { ...action, id: Date.now() }
      screenContext.setValue(`__pending_${action.type}`, payload)
      return payload
    }

    default:
      console.warn('[pocketshot] Unknown action type:', (action as { type: string }).type)
      return undefined
  }
}

function isSharedAction(action: Action): action is SharedAction {
  return sharedActionTypeSet.has(action.type)
}

function resolveText(
  value: string,
  deps: ActionExecutorDeps,
  context: Record<string, unknown>,
): string {
  return resolveRuntimeTemplate(value, {
    values: deps.screenContext.values,
    context,
  })
}

function splitTargets(targets: string): string[] {
  return targets
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function resolveShareAction(
  action: ShareAction,
  deps: ActionExecutorDeps,
  context: Record<string, unknown>,
): { message?: string; url?: string; title?: string } {
  return {
    ...(action.message ? { message: resolveText(action.message, deps, context) } : {}),
    ...(action.url ? { url: resolveText(action.url, deps, context) } : {}),
    ...(action.title ? { title: resolveText(action.title, deps, context) } : {}),
  }
}

async function writeClipboard(text: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setClipboardString } =
      require('../../share/index') as typeof import('../../share/index')
    await setClipboardString(text)
  } catch {
    // clipboard is optional in this package boundary
  }
}
