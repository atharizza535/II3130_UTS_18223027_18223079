'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const path = usePathname()
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded ${
        path === href ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="flex flex-wrap gap-2 bg-white shadow p-3 sticky top-0 z-10">
      {link('/dashboard', 'Dashboard')}
      {link('/dashboard/leaderboard', 'Leaderboard')}
      {link('/virtual-lab/terminal', 'Virtual Lab')}
      {link('/virtual-lab/ctf', 'CTF')}
      {link('/dashboard/wiki', 'Wiki')}
      {link('/dashboard/admin/challenges', 'Admin')}
    </nav>
  )
}
