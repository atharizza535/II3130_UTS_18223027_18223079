'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: '🏠 Dashboard' },
  { href: '/dashboard/tasks', label: '✅ Tasks' },
  { href: '/dashboard/announcements', label: '📢 Announcements' },
  { href: '/dashboard/virtual-lab', label: '🧪 Virtual Lab' },
  { href: '/dashboard/leaderboard', label: '🏆 Leaderboard' },
  { href: '/dashboard/schedule', label: '📅 Schedule' },
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col">

      <div className="p-4 border-b border-indigo-600">
        <Link href="/dashboard" className="flex justify-center items-center">
          <Image
            src="/applogo.png" // Pastikan applogo.png ada di folder /public
            alt="App Logo"
            width={192}   // Sesuaikan lebar (width) logo Anda
            height={50}  // Sesuaikan tinggi (height) logo Anda
            priority      // Membantu memuat logo lebih cepat
          />
        </Link>
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