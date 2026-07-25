import type {
  AiConversation,
  AiConversationProjection,
  AiProjectedAction,
  AiProjectedMessage,
  AiProjectionAudience,
} from './types'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const projectAction = (
  action: AiConversation['messages'][number]['actions'][number],
  audience: AiProjectionAudience,
): AiProjectedAction => {
  const projected: AiProjectedAction = {
    id: action.id,
    kind: action.kind,
    status: action.status,
  }
  if (audience === 'owner') {
    projected.input = clone(action.input)
    if (action.rationale !== undefined) projected.rationale = action.rationale
    if (action.result !== undefined) projected.result = clone(action.result)
  }
  return projected
}

const projectMessage = (
  message: AiConversation['messages'][number],
  audience: AiProjectionAudience,
): AiProjectedMessage => {
  const owner = audience === 'owner'
  const support = audience === 'support'
  const userText = message.role === 'user' && !owner ? '[redacted user message]' : message.text
  return {
    id: message.id,
    role: message.role,
    text: userText,
    citations: message.citations.map((citation) =>
      owner
        ? clone(citation)
        : {
            id: citation.id,
            title: citation.title,
            ...(support && citation.url ? { url: citation.url } : {}),
          },
    ),
    actions: message.actions.map((action) => projectAction(action, audience)),
    status: message.status,
    createdAt: message.createdAt,
    ...(message.completedAt ? { completedAt: message.completedAt } : {}),
    ...(owner && message.error ? { error: message.error } : {}),
  }
}

/**
 * Creates an allowlisted conversation view. Support/public projections never contain
 * user prompts, structured model parts, action inputs/results, provenance, token usage,
 * citation excerpts, or internal errors.
 */
export function projectAiConversation(
  conversation: AiConversation,
  audience: AiProjectionAudience,
): AiConversationProjection {
  return {
    id: conversation.id,
    title: audience === 'owner' ? conversation.title : 'AI conversation',
    status: conversation.status,
    messages: conversation.messages.map((message) => projectMessage(message, audience)),
    usage: audience === 'owner' ? clone(conversation.usage) : null,
    updatedAt: conversation.updatedAt,
  }
}
