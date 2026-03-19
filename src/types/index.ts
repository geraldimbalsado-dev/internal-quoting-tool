export type Role = 'admin' | 'sales'

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'changes_requested'
  | 'rejected'

export type ActivityEventType =
  | 'quote_created'
  | 'quote_sent'
  | 'quote_opened'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_changes_requested'
  | 'version_created'
  | 'client_created'
  | 'client_updated'
  | 'quote_updated'
  | 'email_sent'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  created_at: string
}

export interface Client {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  owner_id: string
  created_at: string
  updated_at: string
  owner?: Profile
}

export interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  base_price: number
  image_url: string | null
  available_sizes: string[]
  available_colors: string[]
  is_active: boolean
  created_at: string
}

export interface MockupSettings {
  x: number
  y: number
  scale: number
  printAreaX: number
  printAreaY: number
  printAreaWidth: number
  printAreaHeight: number
}

export interface QuoteItem {
  id: string
  quote_id: string
  product_id: string
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
  discount: number
  lead_time: string | null
  mockup_settings: MockupSettings | null
  mockup_url: string | null
  sort_order: number
  created_at: string
  product?: Product
}

export interface Quote {
  id: string
  quote_number: string
  client_id: string
  owner_id: string
  status: QuoteStatus
  validity_date: string | null
  notes: string | null
  version: number
  parent_quote_id: string | null
  public_token: string
  created_at: string
  updated_at: string
  client?: Client
  owner?: Profile
  items?: QuoteItem[]
}

export interface ActivityLog {
  id: string
  quote_id: string | null
  client_id: string | null
  user_id: string | null
  event_type: ActivityEventType
  metadata: Record<string, unknown> | null
  created_at: string
  user?: Profile
}

// Computed helpers
export function calcLineTotal(item: QuoteItem): number {
  const subtotal = item.unit_price * item.quantity
  return subtotal * (1 - item.discount / 100)
}

export function calcQuoteTotal(items: QuoteItem[]): number {
  return items.reduce((sum, item) => sum + calcLineTotal(item), 0)
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  approved: 'Approved',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  changes_requested: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}
