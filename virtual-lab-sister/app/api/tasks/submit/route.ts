// app/api/tasks/submit/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  console.log('🚀 ========== TASK SUBMIT DEBUG START ==========')
  
  try {
    const formData = await req.formData()
    const taskId = formData.get('taskId') as string
    const file = formData.get('file') as File | null
    const accessToken = formData.get('accessToken') as string

    console.log('📝 Step 1: Request Data Received')
    console.log('  - Task ID:', taskId)
    console.log('  - Has File:', !!file)
    console.log('  - File Name:', file?.name)
    console.log('  - File Size:', file?.size, 'bytes')
    console.log('  - File Type:', file?.type)
    console.log('  - Has Token:', !!accessToken)

    if (!taskId || !file || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Step 1: Verify user with their token
    const userSupabase = createClient(
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

    const { data: { user }, error: authError } = await userSupabase.auth.getUser()

    console.log('🔐 Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email,
      authError: authError?.message 
    })

    if (authError || !user) {
      console.error('❌ Auth failed:', authError)
      return NextResponse.json(
        { 
          error: 'Unauthorized - Please login again',
          details: authError?.message
        },
        { status: 401 }
      )
    }

    // Step 2: Convert file to base64
    console.log('🔄 Converting file to base64...')
    const fileBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(fileBuffer).toString('base64')
    
    // Create file metadata object
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: base64Data,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id
    }

    console.log('📦 File data prepared:', {
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      base64Length: base64Data.length
    })

    // Step 3: Get the current task to check if it exists
    const { data: existingTask, error: fetchError } = await userSupabase
      .from('tasks')
      .select('id, status')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      console.error('❌ Task not found:', fetchError)
      return NextResponse.json(
        { 
          error: 'Task not found', 
          details: fetchError?.message 
        },
        { status: 404 }
      )
    }

    console.log('✅ Task found:', existingTask)

    // Step 4: Update task with SERVICE ROLE to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update the task - using service role to avoid RLS/trigger issues
    const { data: taskData, error: updateError } = await serviceSupabase
      .from('tasks')
      .update({
        status: 'done',
        file_url: JSON.stringify(fileData)
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Task update error:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to update task', 
          details: updateError.message,
          code: updateError.code 
        },
        { status: 500 }
      )
    }

    console.log('✅ Task updated successfully with base64 file')

    // Step 5: Create notification for task creator
    try {
      const { error: notifError } = await serviceSupabase
        .from('notifications')
        .insert({
          user_id: taskData.created_by,
          message: `Tugas "${taskData.title}" telah diselesaikan oleh ${user.email}`,
        })

      if (notifError) {
        console.error('⚠️ Failed to create notification:', notifError)
        // Don't fail the request if notification fails
      } else {
        console.log('📬 Notification created successfully')
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr)
      // Don't fail the request if notification fails
    }

    console.log('🏁 ========== TASK SUBMIT SUCCESS ==========')

    return NextResponse.json({ 
      success: true, 
      data: taskData
    })

  } catch (err: any) {
    console.error('💥 Unexpected error:', err)
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}