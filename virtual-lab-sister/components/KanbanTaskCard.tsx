'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

const priorityColors: { [key: string]: string } = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-blue-100 text-blue-700',
}

const formatDate = (dateString: string) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}


const formatRemainingDays = (dateString: string) => {
  if (!dateString) return null
  const now = new Date()
  const deadline = new Date(dateString)
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return <span className="text-red-600">Terlambat {Math.abs(diffDays)} hari</span>
  }
  if (diffDays === 0) {
    return <span className="text-yellow-600">Hari ini</span>
  }
  return <span>{diffDays} hari lagi</span>
}

export default function KanbanTaskCard({ task, onTaskUpdate }: { task: any, onTaskUpdate: () => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // This is the line that caused your error. It should work now.
      const { data: fileData, error: fileError } = await supabase.storage
        .from('task-files') // Bucket name
        .upload(`${task.created_by || 'unknown'}/${Date.now()}_${file.name}`, file)

      if (fileError) throw fileError

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'done', file_url: fileData.path }) 
        .eq('id', task.id)

      if (updateError) throw updateError
      onTaskUpdate()

    } catch (error: any) {
      const msg = (error as Error)?.message ?? String(error)
      console.error('Error uploading file and updating task:', msg)
      alert('Gagal mengunggah file: ' + msg)
    } finally {
      setIsUploading(false)
    }
  }

  // *** FIX IS HERE ***
  // Use the environment variable to build the public URL.
  const filePublicUrl = task.file_url 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/task-files/${task.file_url}`
    : null

  const title = task.title || 'Tanpa Judul'
  const description = task.description || 'Tidak ada deskripsi.'
  const priority = task.priority || 'Medium'
  const course = task.course || 'Mata Kuliah Umum'
  const assignee = task.assignee || 'Belum di-assign'
  const deadline = formatDate(task.due_at)
  const remainingDays = formatRemainingDays(task.due_at)

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            priorityColors[priority] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {priority}
        </span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2">{description}</p>

      <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
        {course}
      </span>

      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
        <span className="truncate pr-2">{assignee}</span>
        {deadline && (
          <span className="text-right whitespace-nowrap">{remainingDays}</span>
        )}
      </div>

      {task.status === 'todo' && (
        <div className="pt-3 border-t">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {isUploading ? 'Mengunggah...' : 'Upload File Tugas'}
          </button>
        </div>
      )}

      {/* *** FIX IS HERE *** */}
      {/* Use the 'filePublicUrl' variable in the href */}
      {task.status === 'done' && filePublicUrl && (
        <div className="pt-3 border-t">
          <a
            href={filePublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm hover:bg-green-200"
          >
            ✓ Lihat File
          </a>
        </div>
      )}
    </div>
  )
}