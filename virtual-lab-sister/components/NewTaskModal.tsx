'use client'
import { useState } from 'react'

interface NewTaskModalProps {
  onClose: () => void
  onSubmit: (formData: FormData) => Promise<void>
}


const courses = [
  "Jaringan Komputer",
  "Sistem Operasi",
  "Sistem dan Arsitektur Komputer",
  "Organisasi dan Arsitektur komputer",
  "Teknologi Platform",
  "Sistem Paralel dan Terdistribusi"
]

export default function NewTaskModal({ onClose, onSubmit }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    await onSubmit(formData) 
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          disabled={loading}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Tambah Tugas Baru</h2>
            <p className="text-sm text-gray-500">Buat tugas baru untuk asisten lab</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Judul Tugas
              </label>
              <input
                type="text"
                name="title"
                id="title"
                placeholder="Masukkan judul tugas"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                placeholder="Deskripsi tugas"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                Mata Kuliah
              </label>
              <select
                name="course"
                id="course"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                defaultValue=""
                required
              >
                <option value="" disabled>Pilih mata kuliah</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Ke
                </label>
                <select
                  name="assignee"
                  id="assignee"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>Pilih asisten</option>
                  <option value="Rafli Dwi Nugraha">Rafli Dwi Nugraha</option>
                  <option value="Brandon Theodore Ferrinov">Brandon Theodore Ferrinov</option>
                  <option value="Aldoy Fauzan Avanza">Aldoy Fauzan Avanza</option>
                  <option value="Wisyendra Lunarmalam">Wisyendra Lunarmalam</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Prioritas
                </label>
                <select
                  name="priority"
                  id="priority"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                  defaultValue="Medium"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>


            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                name="deadline"
                id="deadline"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>


          <div className="p-6 bg-gray-50 border-t flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Membuat...' : 'Buat Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}