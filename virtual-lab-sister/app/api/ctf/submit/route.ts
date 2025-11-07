export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, flag } = body
    
    console.log('🔍 CTF Submit - Request:', { id, flagLength: flag?.length })
    
    if (!id || !flag) {
      console.error('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: id and flag are required' }, 
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔐 Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { 
          error: 'Unauthorized - Please login again',
          details: 'Authentication failed or session expired'
        }, 
        { status: 401 }
      )
    }

    // Hash the submitted flag
    const hash = createHash('sha256').update(flag.trim()).digest('hex')
    console.log('🔐 Flag hash:', hash.substring(0, 16) + '...')

    // Get challenge
    const { data: chall, error: fetchError } = await supabase
      .from('ctf_challenges')
      .select('*')
      .eq('id', id)
      .single()
    
    console.log('📋 Challenge fetch:', {
      found: !!chall,
      title: chall?.title,
      error: fetchError?.message
    })
      
    if (fetchError || !chall) {
      console.error('❌ Challenge not found:', fetchError)
      return NextResponse.json(
        { 
          error: 'Challenge not found',
          details: fetchError?.message || 'Challenge does not exist'
        }, 
        { status: 404 }
      )
    }

    // Compare hashes
    const correct = chall.flag_hash === hash
    console.log('✅ Flag check:', { correct, expectedHash: chall.flag_hash.substring(0, 16) + '...' })

    // Record submission
    const { error: insertError } = await supabase
      .from('ctf_submissions')
      .insert({
        user_id: user.id,
        challenge_id: id,
        submitted_flag: flag,
        correct,
      })
    
    console.log('💾 Submission record:', {
      success: !insertError,
      error: insertError?.message
    })
      
    if (insertError) {
      console.error('❌ Insert error:', insertError)
      
      // Check if it's a permission error
      if (insertError.code === '42501') {
        return NextResponse.json(
          { 
            error: 'Permission denied',
            details: 'Check RLS policies on ctf_submissions table'
          }, 
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to record submission', 
          details: insertError.message 
        }, 
        { status: 500 }
      )
    }

    console.log('✅ Submission successful:', { correct })
    return NextResponse.json({ correct })
    
  } catch (err: any) {
    console.error('💥 Unexpected error:', err)
    return NextResponse.json(
      { 
        error: 'Server error',
        details: err.message 
      }, 
      { status: 500 }
    )
  }
}