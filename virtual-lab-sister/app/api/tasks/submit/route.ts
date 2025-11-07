// app/api/tasks/submit/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const taskId = formData.get('taskId') as string
    const file = formData.get('file') as File | null
    const accessToken = formData.get('accessToken') as string

    console.log('📝 Submit Task Request:', { 
      taskId, 
      hasFile: !!file, 
      fileName: file?.name,
      fileSize: file?.size,
      hasToken: !!accessToken 
    })

    if (!taskId || !file || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check file size (max 5MB to avoid database issues)
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

    // Step 3: Update task with base64 data using SERVICE ROLE
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

    const { data: taskData, error: updateError } = await serviceSupabase
      .from('tasks')
      .update({
        status: 'done',
        file_url: JSON.stringify(fileData) // Store as JSON string
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Task update error:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to update task', 
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Task updated successfully with base64 file')

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