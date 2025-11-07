'use client'
import { useState } from 'react'

interface NewEventModalProps {
  onClose: () => void
  onSubmit: (formData: FormData) => Promise<void>
}


const courses = [
  "Jaringan Komputer",
  "Sistem Operasi",
  "Sistem dan Arsitektur Komputer",
  "Organisasi dan Arsitektur komputer",
  "Teknologi Platform",
  "Sistem Paralel dan Terdistribusi",
  "Lainnya"
]


const categories = [
  "Deadline Mahasiswa",
  "Tugas Asisten",
  "Praktikum",
  "Rapat",
  "Lainnya"
]

export default function NewEventModal({ onClose, onSubmit }: NewEventModalProps) {
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
            <h2 className="text-xl font-semibold">Tambah Event Baru</h2>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Event
              </label>
              <input
                type="text"
                name="title"
                id="title"
                placeholder="cth: Rapat Koordinasi Asisten"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                name="category"
                id="category"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                defaultValue=""
                required
              >
                <option value="" disabled>Pilih kategori...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                Mata Kuliah Terkait
              </label>
              <select
                name="course"
                id="course"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                defaultValue=""
                required
              >
                <option value="" disabled>Pilih mata kuliah...</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                Waktu Mulai
              </label>
              <input
                type="datetime-local"
                name="start_time"
                id="start_time"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            
             <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Ditugaskan Ke (Opsional)
              </label>
              <input
                type="text"
                name="assignee"
                id="assignee"
                placeholder="cth: Budi Santoso"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

          </div>

          <div className="p-6 bg-gray-50 border-t flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Tambah Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}