import { ACTION_TYPES, type ActionConfig } from '@lastshotlabs/frontend-contract/actions'
import {
  isAssignWorkflowNode,
  isCaptureWorkflowNode,
  isIfWorkflowNode,
  isParallelWorkflowNode,
  isRetryWorkflowNode,
  isRunWorkflowAction,
  isTryWorkflowNode,
  isWaitWorkflowNode,
  normalizeWorkflowDefinition,
} from './builtins'
import type {
  WorkflowCondition,
  WorkflowDefinition,
  WorkflowExecutionRuntime,
  WorkflowMap,
} from '@lastshotlabs/frontend-contract/workflows'

function evaluateCondition(
  condition: WorkflowCondition,
  runtime: WorkflowExecutionRuntime,
  context: Record<string, unknown>,
): boolean {
  const left = runtime.resolveValue(condition.left, context)
  const right = runtime.resolveValue(condition.right, context)
  const operator = condition.operator ?? 'truthy'

  switch (operator) {
    case 'falsy':
      return !left
    case 'equals':
      return left === right
    case 'not-equals':
      return left !== right
    case 'exists':
      return left !== undefined && left !== null
    default:
      return Boolean(left)
  }
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

function setContextPath(
  context: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const segments = path.split('.').filter(Boolean)
  if (segments.length === 0) {
    return context
  }

  const next = { ...context }
  let cursor: Record<string, unknown> = next

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]!
    const existing = cursor[segment]
    const nested =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {}
    cursor[segment] = nested
    cursor = nested
  }

  cursor[segments[segments.length - 1]!] = value
  return next
}

export async function runWorkflow(
  definition: WorkflowDefinition,
  options: {
    workflows?: WorkflowMap
    context?: Record<string, unknown>
    resolveValue: (value: unknown, context: Record<string, unknown>) => unknown
    executeAction: (action: ActionConfig, context: Record<string, unknown>) => Promise<unknown>
  },
): Promise<void> {
  const workflows = options.workflows ?? {}

  const runDefinition = async (
    nextDefinition: WorkflowDefinition,
    nextContext: Record<string, unknown>,
  ): Promise<void> => {
    let currentContext = nextContext
    const runtime: WorkflowExecutionRuntime = {
      get context() {
        return currentContext
      },
      resolveValue: options.resolveValue,
      executeAction: options.executeAction,
      getWorkflow: (name) => workflows[name],
      runDefinition: (nestedDefinition, nestedContext) =>
        runDefinition(nestedDefinition, {
          ...currentContext,
          ...(nestedContext ?? {}),
        }),
    }

    for (const node of normalizeWorkflowDefinition(nextDefinition)) {
      if ('when' in node && node.when && !evaluateCondition(node.when, runtime, currentContext)) {
        continue
      }

      if (isIfWorkflowNode(node)) {
        const branch = evaluateCondition(node.condition, runtime, currentContext)
          ? node.then
          : node.else
        if (branch) {
          await runDefinition(branch, currentContext)
        }
        continue
      }

      if (isWaitWorkflowNode(node)) {
        await delay(node.duration)
        continue
      }

      if (isParallelWorkflowNode(node)) {
        await Promise.all(node.branches.map((branch) => runDefinition(branch, currentContext)))
        continue
      }

      if (isRetryWorkflowNode(node)) {
        const delayMs = node.delayMs ?? 0
        const backoffMultiplier = node.backoffMultiplier ?? 1
        let lastError: unknown

        for (let attempt = 0; attempt < node.attempts; attempt += 1) {
          try {
            await runDefinition(node.step, currentContext)
            lastError = undefined
            break
          } catch (error) {
            lastError = error
            if (attempt >= node.attempts - 1) {
              break
            }

            const waitTime = Math.round(delayMs * Math.pow(backoffMultiplier, attempt))
            if (waitTime > 0) {
              await delay(waitTime)
            }
          }
        }

        if (lastError !== undefined) {
          if (node.onFailure) {
            await runDefinition(node.onFailure, {
              ...currentContext,
              error: lastError,
            })
            continue
          }
          throw lastError
        }

        continue
      }

      if (isAssignWorkflowNode(node)) {
        currentContext = {
          ...currentContext,
          ...(options.resolveValue(node.values, currentContext) as Record<string, unknown>),
        }
        continue
      }

      if (isTryWorkflowNode(node)) {
        let caughtError: unknown
        try {
          await runDefinition(node.step, currentContext)
        } catch (error) {
          caughtError = error
          if (node.catch) {
            await runDefinition(node.catch, {
              ...currentContext,
              error,
            })
          } else {
            throw error
          }
        } finally {
          if (node.finally) {
            await runDefinition(node.finally, {
              ...currentContext,
              ...(caughtError !== undefined ? { error: caughtError } : {}),
            })
          }
        }
        continue
      }

      if (isCaptureWorkflowNode(node)) {
        const result = await options.executeAction(node.action, currentContext)
        currentContext = setContextPath(currentContext, node.as, result)
        continue
      }

      if (isRunWorkflowAction(node)) {
        const workflow = workflows[node.workflow]
        if (!workflow) {
          throw new Error(`Unknown workflow "${node.workflow}"`)
        }

        const input =
          node.input && typeof node.input === 'object'
            ? (options.resolveValue(node.input, currentContext) as Record<string, unknown>)
            : {}

        await runDefinition(workflow, {
          ...currentContext,
          ...input,
        })
        continue
      }

      if (ACTION_TYPES.includes(node.type)) {
        await options.executeAction(node as ActionConfig, currentContext)
        continue
      }

      throw new Error(`Unknown workflow node type "${node.type}"`)
    }
  }

  await runDefinition(definition, options.context ?? {})
}
