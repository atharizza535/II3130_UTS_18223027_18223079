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

    // Step 1: Verify user with their token (like CTF does)
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

    // Step 2: Upload file using SERVICE ROLE (bypasses all RLS)
    // This is the KEY difference - we use service role for storage!
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key!
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const fileName = `${user.id}/${Date.now()}_${file.name}`
    console.log('📤 Uploading with SERVICE ROLE:', fileName)

    const fileBuffer = await file.arrayBuffer()
    
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('task-files')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      )
    }

    console.log('✅ File uploaded:', uploadData.path)

    // Step 3: Update task using USER's token (like CTF does for submissions)
    const { data: taskData, error: updateError } = await userSupabase
      .from('tasks')
      .update({
        status: 'done',
        file_url: uploadData.path
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Task update error:', updateError)
      
      // Clean up uploaded file
      await serviceSupabase.storage.from('task-files').remove([fileName])
      
      return NextResponse.json(
        { 
          error: 'Failed to update task', 
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Task updated successfully')

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