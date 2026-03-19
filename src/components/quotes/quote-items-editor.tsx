'use client'

import { useState, useTransition, useRef, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { ItemRowForm } from './item-row-form'
import { LogoUploadPanel } from './logo-upload-panel'
import { addQuoteItemAction, updateQuoteItemAction, deleteQuoteItemAction } from '@/lib/actions/quote-items'
import { type Product, type QuoteItem, type MockupSettings, calcLineTotal, calcQuoteTotal } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'

interface QuoteItemsEditorProps {
  quoteId: string
  items: QuoteItem[]
  products: Product[]
  canEdit: boolean
}

export function QuoteItemsEditor({ quoteId, items: initialItems, products, canEdit }: QuoteItemsEditorProps) {
  // Mirror prop into state; update when prop changes (after server revalidation)
  const [items, setItems] = useState<QuoteItem[]>(initialItems)
  const prevInitial = useRef(initialItems)
  if (prevInitial.current !== initialItems) {
    prevInitial.current = initialItems
    setItems(initialItems)
  }
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [mockupItemId, setMockupItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const total = calcQuoteTotal(items)

  const addAction = addQuoteItemAction.bind(null, quoteId)
  const wrappedAddAction = async (formData: FormData) => {
    const result = await addAction(formData)
    if (!result?.error) setShowAddForm(false)
    return result
  }

  function handleDeleteConfirm(itemId: string) {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteQuoteItemAction(quoteId, itemId)
      if (result?.error) {
        setDeleteError(result.error)
      } else {
        setDeletingItemId(null)
      }
    })
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  function handleMockupSaved(itemId: string, mockupUrl: string, settings: MockupSettings) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, mockup_url: mockupUrl, mockup_settings: settings } : it
      )
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Color</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Discount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lead Time</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mockup</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              {canEdit && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0 && !showAddForm && (
              <tr>
                <td colSpan={canEdit ? 10 : 9} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No items yet. {canEdit && 'Click "Add Item" to start building the quote.'}
                </td>
              </tr>
            )}

            {items.map((item) => {
              const product = productMap[item.product_id]
              const isEditing = editingItemId === item.id
              const isDeleting = deletingItemId === item.id

              if (isEditing) {
                const updateAction = async (formData: FormData) => {
                  const result = await updateQuoteItemAction(quoteId, item.id, formData)
                  if (!result?.error) setEditingItemId(null)
                  return result
                }
                return (
                  <ItemRowForm
                    key={item.id}
                    products={products}
                    item={item}
                    action={updateAction}
                    onCancel={() => setEditingItemId(null)}
                  />
                )
              }

              const isShowingMockup = mockupItemId === item.id

              return (
                <Fragment key={item.id}>
                  <tr className="hover:bg-slate-50 group">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {product?.name ?? 'Unknown product'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.size || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{item.color || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {item.discount > 0 ? `${item.discount}%` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.lead_time || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setMockupItemId(isShowingMockup ? null : item.id)}
                        className={`flex items-center gap-1 text-xs font-medium rounded px-2 py-1 transition-colors ${
                          item.mockup_url
                            ? 'text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        {item.mockup_url ? 'View' : 'Add'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(calcLineTotal(item))}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        {isDeleting ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleDeleteConfirm(item.id)}
                              disabled={isPending}
                              className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                            >
                              {isPending ? 'Removing…' : 'Confirm'}
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              onClick={() => setDeletingItemId(null)}
                              className="text-xs text-slate-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingItemId(item.id); setShowAddForm(false); setMockupItemId(null) }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Edit item"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItemId(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                  {/* Mockup panel */}
                  {isShowingMockup && (
                    <tr>
                      <td colSpan={canEdit ? 10 : 9} className="p-0">
                        <LogoUploadPanel
                          item={{ ...item, product }}
                          onClose={() => setMockupItemId(null)}
                          onMockupSaved={handleMockupSaved}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {/* Inline add form */}
            {showAddForm && canEdit && (
              <ItemRowForm
                products={products}
                action={wrappedAddAction}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </tbody>

          {/* Totals footer */}
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={canEdit ? 9 : 8} className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                  Quote Total
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-slate-900">
                  {formatCurrency(total)}
                </td>
                {canEdit && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {deleteError && (
        <p className="mt-2 px-4 text-sm text-red-600">{deleteError}</p>
      )}

      {/* Add item button */}
      {canEdit && !showAddForm && editingItemId === null && (
        <div className="px-4 pt-3 pb-1 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </Button>
        </div>
      )}
    </div>
  )
}
