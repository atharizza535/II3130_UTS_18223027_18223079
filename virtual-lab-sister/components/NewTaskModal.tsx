'use client'
import { useState } from 'react'


interface NewTaskModalProps {
  onClose: () => void
  onSubmit: (formData: FormData) => void // Kita gunakan FormData untuk file upload
}

const courses = [
  "Jaringan Komputer",
  "Sistem Operasi",
  "Sistem dan Arsitektur Komputer",
  "Organisasi dan Arsitektur komputer",
  "Teknologi Platform",
  "Sistem Paralel dan terdistribusi"
]

export default function NewTaskModal({ onClose, onSubmit }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    

    console.log("Form data to be submitted:")
    for (let [key, value] of formData.entries()) {
      console.log(key, value)
    }
    setLoading(false)

  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h2 className="text-xl font-semibold">Tambah Tugas Baru</h2>
              <p className="text-sm text-gray-500">Buat tugas baru untuk asisten lab</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              &times;
            </button>
          </div>


          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Judul Tugas
              </label>
              <input
                type="text"
                name="title"
                id="title"
                placeholder="Masukkan judul tugas"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                Mata Kuliah
              </label>
              <select
                name="course"
                id="course"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                defaultValue=""
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>Pilih asisten</option>
                  <option value="1">Andi Wijaya</option>
                  <option value="2">Budi Santoso</option>
                  <option value="3">Citra Dewi</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Prioritas
                </label>
                <select
                  name="priority"
                  id="priority"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  defaultValue="medium"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>


            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Upload File Tugas (Opsional)
              </label>
              <input
                type="file"
                name="file"
                id="file"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>


          <div className="p-4 bg-gray-50 border-t text-right">
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