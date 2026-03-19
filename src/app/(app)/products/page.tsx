export const dynamic = 'force-dynamic'

import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Package } from 'lucide-react'

export default async function ProductsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, category, base_price, available_sizes, available_colors, is_active')
    .order('category')
    .order('name')

  type ProductRow = NonNullable<typeof products>[number]
  const byCategory = (products ?? []).reduce<Record<string, ProductRow[]>>((acc, p) => {
    if (!p) return acc
    const cat = p.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat]!.push(p)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {products?.length ?? 0} products across {Object.keys(byCategory).length} categories
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {category}
            </h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Product</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Sizes</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Colors</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Base Price</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product, i) => (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{product.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.available_sizes.length > 0
                          ? product.available_sizes.join(', ')
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.available_colors.length > 0
                          ? product.available_colors.join(', ')
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(product.base_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {(products ?? []).length === 0 && (
          <div className="text-center py-16">
            <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No products in catalog</p>
          </div>
        )}
      </div>
    </div>
  )
}
