import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'quotes@yourdomain.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function reviewUrl(token: string) {
  return `${APP_URL}/review/${token}`
}

// ─── Templates ────────────────────────────────────────────────────────────────

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a}
  .wrap{max-width:580px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden}
  .header{background:#1e40af;padding:28px 32px}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px}
  .header p{margin:4px 0 0;color:#93c5fd;font-size:13px}
  .body{padding:32px}
  .body p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155}
  .btn{display:inline-block;padding:14px 28px;background:#2563eb;color:#fff!important;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;margin:8px 0 16px}
  .meta{background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0}
  .meta p{margin:0 0 6px;font-size:13px;color:#64748b}
  .meta p:last-child{margin:0}
  .meta strong{color:#0f172a}
  .footer{border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center}
  .footer p{margin:0;font-size:12px;color:#94a3b8}
</style>
</head>
<body>
<div class="wrap">${content}</div>
</body>
</html>`
}

// Template: send quote to client
export function quoteEmailHtml(opts: {
  clientName: string
  companyName: string
  senderName: string
  quoteNumber: string
  version: number
  validityDate: string | null
  itemCount: number
  token: string
  isResend?: boolean
}) {
  const url = reviewUrl(opts.token)
  const subject = opts.isResend
    ? `Updated Quote ${opts.quoteNumber} from ${opts.companyName ?? 'us'}`
    : `Your Quote from ${opts.companyName ?? 'us'} — ${opts.quoteNumber}`

  const intro = opts.isResend
    ? `We've prepared a revised quote for you to review. This replaces the previous version.`
    : `Please find your quote below. You can review the full details, including pricing and product mockups, by clicking the button below.`

  const html = baseLayout(`
    <div class="header">
      <h1>${opts.isResend ? 'Updated Quote Ready' : 'Your Quote is Ready'}</h1>
      <p>${esc(subject)}</p>
    </div>
    <div class="body">
      <p>Hi ${esc(opts.clientName)},</p>
      <p>${intro}</p>
      <a href="${url}" class="btn">Review Quote →</a>
      <div class="meta">
        <p>Quote: <strong>${esc(opts.quoteNumber)}</strong> (v${opts.version})</p>
        ${opts.validityDate ? `<p>Valid until: <strong>${esc(opts.validityDate)}</strong></p>` : ''}
        <p>Items: <strong>${opts.itemCount}</strong></p>
      </div>
      <p>You can approve the quote, request changes, or decline — all from the review page. No account needed.</p>
      <p>If you have questions, reply to this email and we'll get back to you.</p>
      <p>Best regards,<br/>${esc(opts.senderName)}</p>
    </div>
    <div class="footer">
      <p>If the button doesn't work, copy this link: <a href="${url}">${url}</a></p>
    </div>
  `)

  return { html, subject }
}

// Template: notify sales user of client response
export function clientResponseEmailHtml(opts: {
  salesName: string
  clientName: string
  clientCompany: string
  quoteNumber: string
  action: string
  comment: string | null
  quoteUrl: string
}) {
  const actionLabels: Record<string, { label: string; color: string }> = {
    approved: { label: 'Approved ✓', color: '#16a34a' },
    rejected: { label: 'Declined', color: '#dc2626' },
    changes_requested: { label: 'Changes Requested', color: '#d97706' },
  }
  const { label, color } = actionLabels[opts.action] ?? { label: opts.action, color: '#475569' }
  const subject = `[${label}] ${opts.clientCompany} responded to ${opts.quoteNumber}`

  const html = baseLayout(`
    <div class="header">
      <h1>Client Responded</h1>
      <p>${esc(opts.quoteNumber)} · ${esc(opts.clientCompany)}</p>
    </div>
    <div class="body">
      <p>Hi ${esc(opts.salesName)},</p>
      <p><strong>${esc(opts.clientName)}</strong> from <strong>${esc(opts.clientCompany)}</strong> has responded to your quote.</p>
      <div class="meta">
        <p>Quote: <strong>${esc(opts.quoteNumber)}</strong></p>
        <p>Response: <strong style="color:${color}">${label}</strong></p>
        ${opts.comment ? `<p>Comment: <strong>${esc(opts.comment)}</strong></p>` : ''}
      </div>
      <a href="${opts.quoteUrl}" class="btn">View Quote →</a>
    </div>
    <div class="footer">
      <p>Sent by QuoteTool</p>
    </div>
  `)

  return { html, subject }
}

// ─── Send functions ───────────────────────────────────────────────────────────

export async function sendQuoteEmail(opts: {
  to: string
  clientName: string
  senderName: string
  quoteNumber: string
  version: number
  validityDate: string | null
  itemCount: number
  token: string
  companyName: string
  isResend?: boolean
}) {
  const { html, subject } = quoteEmailHtml(opts)

  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject,
    html,
  })

  if (error) {
    console.error('sendQuoteEmail error:', error)
    throw new Error(error.message)
  }
}

export async function sendClientResponseNotification(opts: {
  to: string
  salesName: string
  clientName: string
  clientCompany: string
  quoteNumber: string
  quoteId: string
  action: string
  comment: string | null
}) {
  const quoteUrl = `${APP_URL}/quotes/${opts.quoteId}`
  const { html, subject } = clientResponseEmailHtml({ ...opts, quoteUrl })

  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject,
    html,
  })

  if (error) {
    console.error('sendClientResponseNotification error:', error)
    throw new Error(error.message)
  }
}
