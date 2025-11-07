// virtual-lab-sister/app/api/tasks/submit/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { taskId, file_url } = body

    if (!taskId || !file_url) {
      return NextResponse.json(
        { error: 'Task ID and file_url are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // 1. Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Securely update the task
    // This runs on the server and bypasses client-side RLS
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'done', // Set status to 'done'
        file_url: file_url  // Save the file path
      })
      .eq('id', taskId) // For the specific task
      // Optionally, you could also add .eq('assignee_id', user.id)
      // if you had an 'assignee_id' column to be even more secure.
      .select()
      .single()

    if (error) {
      console.error('Task update error:', error)
      // This is likely the error you were seeing,
      // but it was happening silently on the client.
      if (error.code === '42501') {
         return NextResponse.json(
          { error: 'Permission denied to update task', details: error.message },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}