'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession()
      if (data.session) setUser(data.session.user)
      else router.push('/auth/login')
      setLoading(false)
    }
    loadUser()
  }, [router])

  if (loading) return <p>Loading...</p>

  return user ? (
    <div className="p-4 text-lg">Welcome, {user.email}</div>
  ) : (
    <p>Redirecting to login...</p>
  )
}
