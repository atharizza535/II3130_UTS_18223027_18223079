'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRealtime } from '@/lib/useRealtime'
import TaskCard from '@/components/TaskCard'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_at', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (err: any) {
      console.error('Error fetching tasks:', err)
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useRealtime('tasks', fetchTasks)

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTitle.trim(),
          description: 'New Task',
          status: 'todo',
          created_by: user.id,
        })
        .select()

      if (error) throw error

      console.log('Task created:', data)
      setNewTitle('')
      await fetchTasks()
    } catch (err: any) {
      console.error('Error creating task:', err)
      setError(err.message)
      alert('Failed to create task: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tasks</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={addTask} className="flex gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          className="border p-2 flex-1 rounded"
          placeholder="Add new task"
          disabled={loading}
        />
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  )
}