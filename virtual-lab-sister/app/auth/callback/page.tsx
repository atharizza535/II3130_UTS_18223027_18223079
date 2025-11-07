'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const finishAuth = async () => {
      console.log('🔐 Auth Callback Started')
      
      try {
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('Session check:', { 
          hasSession: !!session, 
          error: error?.message 
        })

        if (error) {
          console.error('Session error:', error)
          router.push('/auth/login')
          return
        }

        if (session) {
          console.log('✅ Session found, redirecting to dashboard')
          router.push('/dashboard')
        } else {
          console.log('❌ No session, redirecting to login')
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        router.push('/auth/login')
      }
    }
    
    finishAuth()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Finalizing login...</p>
      </div>
    </div>
  )
}