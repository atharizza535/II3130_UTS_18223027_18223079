export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { userId, challengeId, submittedFlag } = await req.json()
    
    if (!userId || !challengeId || !submittedFlag) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload' }, 
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { data, error } = await supabase.rpc('submit_flag', {
      uid: userId,
      cid: challengeId,
      submitted: submittedFlag,
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Server error', error: error.message }, 
        { status: 500 }
      )
    }

    const result = data as { status: string; msg: string }
    const success = result.status === 'ok'
    return NextResponse.json({ success, message: result.msg })
    
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: 'Server error' }, 
      { status: 500 }
    )
  }
}