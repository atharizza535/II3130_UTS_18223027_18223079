'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'

const navItems = [
  { href: '/dashboard', label: '🏠 Dashboard' },
  { href: '/dashboard/tasks', label: '✅ Tasks' },
  { href: '/dashboard/announcements', label: '📢 Announcements' },
  { href: '/dashboard/wiki', label: '📚 Wiki' },
  { href: '/dashboard/virtual-lab', label: '🧪 Virtual Lab' },
  { href: '/dashboard/leaderboard', label: '🏆 Leaderboard' },
  { href: '/dashboard/schedule', label: '📅 Schedule' },
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col">
      <div className="p-4 border-b border-indigo-600">
        <h1 className="text-2xl font-bold">Virtual Lab</h1>
        <p className="text-sm text-indigo-200 mt-1">Sister Platform</p>
      </div>

      {/* Notification Bell */}
      <div className="px-4 py-3 border-b border-indigo-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Notifikasi</span>
          <NotificationBell />
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded transition-colors ${
                isActive
                  ? 'bg-indigo-500 font-semibold'
                  : 'hover:bg-indigo-600'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-indigo-600">
        <button
          onClick={async () => {
            const { supabase } = await import('@/lib/supabaseClient')
            await supabase.auth.signOut()
            window.location.href = '/'
          }}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}