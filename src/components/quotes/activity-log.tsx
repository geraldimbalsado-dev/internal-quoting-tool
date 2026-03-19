import { type ActivityLog, type ActivityEventType } from '@/types'
import { formatDateTime } from '@/lib/utils'
import {
  Send,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  GitBranch,
  FilePlus,
  Pencil,
  Mail,
  RefreshCw,
} from 'lucide-react'

const EVENT_CONFIG: Record<
  ActivityEventType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  quote_created: { label: 'Quote created', icon: FilePlus, color: 'text-slate-600', bg: 'bg-slate-100' },
  quote_updated: { label: 'Quote updated', icon: Pencil, color: 'text-slate-600', bg: 'bg-slate-100' },
  quote_sent: { label: 'Sent to client', icon: Send, color: 'text-blue-600', bg: 'bg-blue-100' },
  email_sent: { label: 'Email sent', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
  quote_opened: { label: 'Opened by client', icon: Eye, color: 'text-violet-600', bg: 'bg-violet-100' },
  quote_approved: { label: 'Approved by client', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  quote_rejected: { label: 'Declined by client', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  quote_changes_requested: { label: 'Changes requested', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-100' },
  version_created: { label: 'New version created', icon: GitBranch, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  client_created: { label: 'Client created', icon: FilePlus, color: 'text-slate-600', bg: 'bg-slate-100' },
  client_updated: { label: 'Client updated', icon: Pencil, color: 'text-slate-600', bg: 'bg-slate-100' },
}

function eventDetail(log: ActivityLog): string | null {
  const m = log.metadata ?? {}

  switch (log.event_type) {
    case 'email_sent':
    case 'quote_sent': {
      const to = m.to as string | undefined
      const isResend = m.is_resend as boolean | undefined
      if (to) return `${isResend ? 'Resent' : 'Sent'} to ${to}`
      return null
    }
    case 'quote_changes_requested':
    case 'quote_approved':
    case 'quote_rejected': {
      const comment = m.comment as string | undefined
      if (comment) return `"${comment}"`
      return null
    }
    case 'version_created': {
      const v = m.new_version as number | undefined
      if (v) return `Version ${v}`
      return null
    }
    default:
      return null
  }
}

interface ActivityLogProps {
  logs: ActivityLog[]
}

export function ActivityTimeline({ logs }: ActivityLogProps) {
  if (logs.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-400">
        No activity recorded yet.
      </div>
    )
  }

  return (
    <ol className="px-4 py-4">
      {logs.map((log, i) => {
        const config = EVENT_CONFIG[log.event_type] ?? {
          label: log.event_type,
          icon: RefreshCw,
          color: 'text-slate-500',
          bg: 'bg-slate-100',
        }
        const Icon = config.icon
        const detail = eventDetail(log)
        const isLast = i === logs.length - 1

        return (
          <li key={log.id} className="flex gap-3">
            {/* Icon + connector */}
            <div className="flex flex-col items-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${config.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </span>
              {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
            </div>

            {/* Content */}
            <div className={`pb-4 min-w-0 ${isLast ? '' : ''}`}>
              <p className="text-sm font-medium text-slate-800 leading-7">{config.label}</p>
              {detail && (
                <p className="text-xs text-slate-500 mt-0.5 break-words">{detail}</p>
              )}
              <p className="text-xs text-slate-400 mt-0.5">
                {formatDateTime(log.created_at)}
                {log.user?.full_name ? ` · ${log.user.full_name}` : ''}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
