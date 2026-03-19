'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { type Product, type QuoteItem, calcLineTotal } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'

interface ItemRowFormProps {
  products: Product[]
  item?: QuoteItem
  action: (formData: FormData) => Promise<{ error?: string | null } | void>
  onCancel: () => void
}

const initialState = { error: null as string | null }

export function ItemRowForm({ products, item, action, onCancel }: ItemRowFormProps) {
  const [selectedProductId, setSelectedProductId] = useState(item?.product_id ?? '')
  const [qty, setQty] = useState(item?.quantity ?? 1)
  const [price, setPrice] = useState(item?.unit_price ?? 0)
  const [discount, setDiscount] = useState(item?.discount ?? 0)

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  // Auto-fill price when product changes (only on initial selection, not on edit)
  useEffect(() => {
    if (selectedProduct && !item) {
      setPrice(selectedProduct.base_price)
    }
  }, [selectedProductId, selectedProduct, item])

  const lineTotal = price * qty * (1 - discount / 100)

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await action(formData)
      return result && 'error' in result ? { error: result.error ?? null } : initialState
    },
    initialState
  )

  return (
    <tr className="bg-blue-50/40 border-b border-blue-100">
      <td colSpan={10} className="px-4 py-3">
        <form action={formAction}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {/* Product */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Product *</label>
              <Select
                name="product_id"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.category ? `(${p.category})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Size</label>
              {selectedProduct && selectedProduct.available_sizes.length > 0 ? (
                <Select name="size" defaultValue={item?.size ?? ''}>
                  <option value="">Any size</option>
                  {selectedProduct.available_sizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              ) : (
                <Input name="size" defaultValue={item?.size ?? ''} placeholder="e.g. M" />
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
              {selectedProduct && selectedProduct.available_colors.length > 0 ? (
                <Select name="color" defaultValue={item?.color ?? ''}>
                  <option value="">Any color</option>
                  {selectedProduct.available_colors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              ) : (
                <Input name="color" defaultValue={item?.color ?? ''} placeholder="e.g. Black" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            {/* Qty */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Qty *</label>
              <Input
                name="quantity"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                required
              />
            </div>

            {/* Unit price */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unit Price ($) *</label>
              <Input
                name="unit_price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Discount (%)</label>
              <Input
                name="discount"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>

            {/* Lead time */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lead Time</label>
              <Input
                name="lead_time"
                defaultValue={item?.lead_time ?? ''}
                placeholder="e.g. 2–3 weeks"
              />
            </div>

            {/* Line total (computed) */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Line Total</label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-100 text-sm font-semibold text-slate-800">
                {formatCurrency(lineTotal)}
              </div>
            </div>
          </div>

          {state.error && (
            <p className="text-sm text-red-600 mb-2">{state.error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={pending}>
              {item ? 'Update Item' : 'Add Item'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </form>
      </td>
    </tr>
  )
}
