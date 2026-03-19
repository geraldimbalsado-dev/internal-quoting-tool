'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Briefcase,
  Package,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { type Profile } from '@/types'

interface SidebarProps {
  profile: Profile
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/clients', label: 'Clients', icon: Users, adminOnly: false },
  { href: '/quotes', label: 'Quotes', icon: FileText, adminOnly: false },
  { href: '/products', label: 'Products', icon: Package, adminOnly: true },
]

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-white text-sm tracking-wide">QuoteTool</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems
          .filter(item => !item.adminOnly || profile.role === 'admin')
          .map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="mb-3 px-1">
          <p className="text-xs font-medium text-white truncate">
            {profile.full_name || profile.email}
          </p>
          <p className="text-xs text-slate-400 truncate capitalize">{profile.role}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
