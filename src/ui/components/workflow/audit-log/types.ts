import type { z } from 'zod'
import type { AuditLogSchema } from './schema'

export type AuditLogConfig = z.input<typeof AuditLogSchema>

export interface AuditEntry {
  id: string
  actor?: { name: string; avatarUrl?: string }
  action: string
  target?: string
  targetType?: string
  detail?: string
  createdAt: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

export type AuditListItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'entry'; key: string; entry: AuditEntry }
