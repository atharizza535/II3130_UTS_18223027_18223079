'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // If redirected back from Supabase with tokens, handle them
    const handleRedirect = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) router.push('/dashboard')
    }
    handleRedirect()
  }, [router])

  async function signInWithEmail() {
    await supabase.auth.signInWithOtp({
      email: 'your@email.com',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={signInWithEmail}
      >
        Sign in with Email
      </button>
    </div>
  )
}
