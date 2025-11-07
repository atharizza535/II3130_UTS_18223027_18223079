'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ErrorDisplay from '@/components/ErrorDisplay'
import SuccessDisplay from '@/components/SuccessDisplay'
import DebugPanel from '@/components/DebugPanel'
import NewTaskModal from '@/components/NewTaskModal'
import Kanban from './kanban' 

interface ErrorState {
  status?: number
  message: string
  details?: any
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isModalOpen, setIsModalOpen] = useState(false)


  async function fetchTasks() {
    try {
      setDebugInfo((prev: any) => ({ ...prev, fetching: true }))
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      setDebugInfo((prev: any) => ({
        ...prev,
        fetching: false,
        fetchResult: { data, error },
        timestamp: new Date().toISOString()
      }))

      if (error) throw error
      setTasks(data || []) 
    } catch (err: any) {
      console.error('Error fetching tasks:', err)
      setError({
        status: err.code ? parseInt(err.code) : undefined,
        message: err.message || 'Failed to fetch tasks',
        details: err
      })
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCreateTask = async (formData: FormData) => {
    console.log("Submitting new task...", formData)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw { status: 401, message: 'Unauthorized' }

      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const course = formData.get('course') as string
      const assignee = formData.get('assignee') as string // <-- Anda perlu ID asisten
      const deadline = formData.get('deadline') as string
      const priority = formData.get('priority') as string
      const file = formData.get('file') as File

      // TODO: Handle file upload ke Supabase Storage di sini jika ada
      // let file_url = null
      // if (file && file.size > 0) {
      //   const { data: fileData, error: fileError } = await supabase.storage
      //     .from('task-files') // Ganti 'task-files' dengan nama bucket Anda
      //     .upload(`${user.id}/${file.name}`, file)
      //   if (fileError) throw fileError
      //   file_url = fileData.path
      // }


      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim(),
          due_at: deadline || null,
          status: 'todo', 
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError
      setSuccess('Tugas berhasil dibuat!')
      setIsModalOpen(false)
      await fetchTasks() 
      setTimeout(() => setSuccess(null), 3000)

    } catch (err: any) {
      console.error('❌ Error creating task:', err)
      setError({
        status: err.status || 500,
        message: err.message || 'Failed to create task',
        details: err.details || err
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Tugas</h1>
          <p className="text-gray-600">Kelola tugas asisten untuk setiap mata kuliah</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          + Tambah Tugas
        </button>
      </div>
      

      <div>
        <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
          <option>Semua Mata Kuliah</option>
        </select>
      </div>


      {isModalOpen && (
        <NewTaskModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      )}


      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      {success && <SuccessDisplay message={success} onDismiss={() => setSuccess(null)} />}
      <DebugPanel data={debugInfo} label="Debug Information" />

      <Kanban />
    </div>
  )
}