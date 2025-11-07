// app/api/ctf/submit/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, flag, accessToken } = body
    
    console.log('🔍 CTF Submit - Request:', { 
      id, 
      flagLength: flag?.length,
      hasToken: !!accessToken 
    })
    
    if (!id || !flag) {
      return NextResponse.json(
        { error: 'Missing required fields: id and flag are required' }, 
        { status: 400 }
      )
    }
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' }, 
        { status: 401 }
      )
    }
    
    // Create Supabase client with access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )
    
    // Verify user with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔐 Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email,
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { 
          error: 'Unauthorized - Please login again',
          details: authError?.message
        }, 
        { status: 401 }
      )
    }

    // Get challenge first
    const { data: chall, error: fetchError } = await supabase
      .from('ctf_challenges')
      .select('*')
      .eq('id', id)
      .single()
    
    console.log('📋 Challenge fetch:', {
      found: !!chall,
      title: chall?.title,
      flagHash: chall?.flag_hash,
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

    // Hash the submitted flag
    const submittedFlag = flag.trim()
    const submittedHash = createHash('sha256').update(submittedFlag).digest('hex')
    
    // DEBUGGING: Log everything
    console.log('🔍 FLAG COMPARISON DEBUG:')
    console.log('  Submitted flag (raw):', JSON.stringify(flag))
    console.log('  Submitted flag (trimmed):', JSON.stringify(submittedFlag))
    console.log('  Submitted flag length:', submittedFlag.length)
    console.log('  Submitted hash:', submittedHash)
    console.log('  Expected hash:', chall.flag_hash)
    console.log('  Hashes match:', chall.flag_hash === submittedHash)
    
    // Try different hash methods to debug
    const hashVariations = {
      normal: createHash('sha256').update(submittedFlag).digest('hex'),
      lowercase: createHash('sha256').update(submittedFlag.toLowerCase()).digest('hex'),
      uppercase: createHash('sha256').update(submittedFlag.toUpperCase()).digest('hex'),
      base64: createHash('sha256').update(submittedFlag).digest('base64'),
    }
    console.log('  Hash variations:', hashVariations)
    
    // Compare hashes
    const correct = chall.flag_hash === submittedHash
    
    console.log('✅ Flag check result:', { 
      correct,
      submittedFlag,
      submittedHash: submittedHash.substring(0, 32) + '...',
      expectedHash: chall.flag_hash.substring(0, 32) + '...',
      fullSubmittedHash: submittedHash,
      fullExpectedHash: chall.flag_hash
    })

    // Record submission - SIMPAN HASH
    const { error: insertError } = await supabase
      .from('ctf_submissions')
      .insert({
        user_id: user.id,
        challenge_id: id,
        submitted_flag: submittedHash, // Simpan hash untuk keamanan
        correct,
      })
    
    console.log('💾 Submission record:', {
      success: !insertError,
      error: insertError?.message
    })
      
    if (insertError) {
      console.error('❌ Insert error:', insertError)
      
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