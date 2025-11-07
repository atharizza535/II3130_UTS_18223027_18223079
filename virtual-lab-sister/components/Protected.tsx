// components/Protected.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useAuth from '@/lib/useAuth'

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth() // <-- Ambil 'loading'
  const router = useRouter()

  useEffect(() => {
    // Logika IF/ELSE yang Anda minta:
    // HANYA redirect JIKA loading selesai DAN user tidak ada
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router]) // <-- Tambahkan 'loading' dan 'router' ke dependencies

  // Tampilkan loader JIKA auth masih loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Tampilkan konten JIKA loading selesai DAN user ada
  if (!loading && user) {
    return <>{children}</>
  }

  // Jika redirect, tampilkan null sementara
  return null
}