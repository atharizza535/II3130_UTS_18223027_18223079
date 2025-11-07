// app/auth/login/page.tsx
'use client'
import { supabase } from '@/lib/supabaseClient'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/lib/useAuth' // <-- Gunakan hook yang sama

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false) // <-- Ganti nama 'loading'
  const router = useRouter()
  
  const { user, loading: authLoading } = useAuth() // <-- Ambil status auth

  // Efek untuk redirect JIKA SUDAH LOGIN
  useEffect(() => {
    // Logika IF/ELSE:
    // JIKA auth loading selesai DAN user ADA (sudah login)
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFormLoading(true) // <-- Gunakan 'formLoading'

    // ... (Sisa fungsi handleLogin Anda SAMA PERSIS)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectUrl = `${origin}/auth/callback`
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setFormLoading(false) // <-- Gunakan 'formLoading'
    }
  }

  // Tampilkan loader JIKA auth masih loading (mengecek apakah sudah login)
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Tampilkan halaman login JIKA auth selesai DAN user TIDAK ADA
  // (JSX Anda dari sebelumnya, hanya ganti 'loading' menjadi 'formLoading' di tombol)
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-80"
      >
        <h2 className="text-lg font-semibold mb-2">Login</h2>
        <p className="text-sm text-gray-600 mb-4">Sign in via magic link</p>

        {sent ? (
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✅</div>
            <p className="text-green-600 text-sm font-medium mb-2">
              Email terkirim!
            </p>
            <p className="text-gray-600 text-xs">
              Cek inbox email Anda untuk link login. Klik link tersebut untuk masuk ke dashboard.
            </p>
          </div>
        ) : (
          <>
            <input
              type="email"
              className="border w-full p-2 rounded mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={formLoading} // <-- Ganti di sini
            />
            <button
              type="submit"
              disabled={formLoading} // <-- Ganti di sini
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {formLoading ? 'Mengirim...' : 'Kirim Link Login'} 
            </button>

            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 text-sm">
                  ⚠️ {error}
                </p>
              </div>
            )}
          </>
        )}
      </form>
    </main>
  )
}