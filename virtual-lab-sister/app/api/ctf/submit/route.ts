export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { id, flag } = await req.json()
    
    if (!id || !flag) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const hash = createHash('sha256').update(flag.trim()).digest('hex')

    const { data: chall, error: fetchError } = await supabase
      .from('ctf_challenges')
      .select('*')
      .eq('id', id)
      .single()
      
    if (fetchError || !chall) {
      console.error('Challenge not found:', fetchError)
      return NextResponse.json(
        { error: 'Challenge not found' }, 
        { status: 404 }
      )
    }

    const correct = chall.flag_hash === hash

    const { error: insertError } = await supabase
      .from('ctf_submissions')
      .insert({
        user_id: user.id,
        challenge_id: id,
        submitted_flag: flag,
        correct,
      })
      
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to record submission', details: insertError.message }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ correct })
    
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    )
  }
}