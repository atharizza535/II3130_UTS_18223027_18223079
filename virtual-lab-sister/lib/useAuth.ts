// lib/useAuth.ts
'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { User } from '@supabase/supabase-js' // Import tipe User jika perlu

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // <-- Tambahkan state loading

  useEffect(() => {
    // Fungsi untuk memeriksa sesi pertama kali
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false) // <-- Selesai loading setelah pengecekan pertama
    }

    checkSession()

    // Listener untuk perubahan auth (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      // Kita tidak set loading di sini karena ini hanya update
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, loading } // <-- Kembalikan user DAN loading
}