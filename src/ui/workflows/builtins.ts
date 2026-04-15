import type { RunWorkflowAction } from '@lastshotlabs/frontend-contract/actions'
import type {
  AssignWorkflowNode,
  CaptureWorkflowNode,
  IfWorkflowNode,
  ParallelWorkflowNode,
  RetryWorkflowNode,
  TryWorkflowNode,
  WaitWorkflowNode,
  WorkflowDefinition,
  WorkflowNode,
} from '@lastshotlabs/frontend-contract/workflows'

export function normalizeWorkflowDefinition(definition: WorkflowDefinition): WorkflowNode[] {
  return Array.isArray(definition) ? definition : [definition]
}

export function isIfWorkflowNode(node: WorkflowNode): node is IfWorkflowNode {
  return node.type === 'if'
}

export function isRunWorkflowAction(node: WorkflowNode): node is RunWorkflowAction {
  return node.type === 'run-workflow'
}

export function isWaitWorkflowNode(node: WorkflowNode): node is WaitWorkflowNode {
  return node.type === 'wait'
}

export function isParallelWorkflowNode(node: WorkflowNode): node is ParallelWorkflowNode {
  return node.type === 'parallel'
}

export function isRetryWorkflowNode(node: WorkflowNode): node is RetryWorkflowNode {
  return node.type === 'retry'
}

export function isAssignWorkflowNode(node: WorkflowNode): node is AssignWorkflowNode {
  return node.type === 'assign'
}

export function isTryWorkflowNode(node: WorkflowNode): node is TryWorkflowNode {
  return node.type === 'try'
}

export function isCaptureWorkflowNode(node: WorkflowNode): node is CaptureWorkflowNode {
  return node.type === 'capture'
}
