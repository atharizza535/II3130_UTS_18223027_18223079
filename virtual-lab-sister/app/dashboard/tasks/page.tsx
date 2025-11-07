'use client'
import { useState, useEffect, useMemo } from 'react'
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

const courses = [
  "Jaringan Komputer",
  "Sistem Operasi",
  "Sistem dan Arsitektur Komputer",
  "Organisasi dan Arsitektur komputer",
  "Teknologi Platform",
  "Sistem Paralel dan Terdistribusi"
]

export default function TasksPage() {
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('Semua Mata Kuliah')

  async function fetchTasks() {
    try {
      setDebugInfo((prev: any) => ({ ...prev, fetching: true }))
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setAllTasks(data || [])
    } catch (err: any) {
      console.error('Error fetching tasks:', err)
      setError({ message: err.message, details: err })
    } finally {
      setDebugInfo((prev: any) => ({ ...prev, fetching: false }))
    }
  }
  
  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCreateTask = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw { status: 401, message: 'Unauthorized' }

      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const course = formData.get('course') as string
      const assignee = formData.get('assignee') as string
      const deadline = formData.get('deadline') as string
      const priority = formData.get('priority') as string

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        course: course,
        assignee: assignee,
        priority: priority,
        due_at: deadline || null,
        status: 'todo',
        created_by: user.id,
      }
      
      setDebugInfo((prev: any) => ({ ...prev, creatingTask: taskData }))

      const { data: newTask, error: insertError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single() 

      if (insertError) throw insertError

      
      if (deadline) {
        const calendarEventData = {
          title: `Tugas: ${title.trim()}`, 
          category: "Tugas Asisten",      
          course: course,
          start_time: new Date(deadline).toISOString(), 
          assignee: assignee,
          created_by: user.id,
        }
        
        setDebugInfo((prev: any) => ({ ...prev, creatingCalendarEvent: calendarEventData }))

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert(calendarEventData)
        
        if (calendarError) {
          console.error('Gagal membuat event kalender otomatis:', calendarError)
          setSuccess('Tugas dibuat, tapi gagal ditambahkan ke kalender.')
        }
      }
      if (!success) {
        setSuccess('Tugas berhasil dibuat')
      }
      
      setIsModalOpen(false)
      await fetchTasks() 
      
      setTimeout(() => setSuccess(null), 3000)

    } catch (err: any) {
      console.error('Error creating task:', err)
      setError({
        status: err.status || 500,
        message: err.message || 'Tugas gagal dibuat',
        details: err.details || err
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filteredTasks = useMemo(() => {
    if (selectedCourse === 'Semua Mata Kuliah') {
      return allTasks
    }
    return allTasks.filter(task => task.course === selectedCourse)
  }, [allTasks, selectedCourse])

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
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option>Semua Mata Kuliah</option>
          {courses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
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

      <Kanban
        tasks={filteredTasks}
        onTaskUpdate={fetchTasks}
      />
      
    </div>
  )
}