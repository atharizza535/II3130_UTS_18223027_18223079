'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ErrorDisplay from '@/components/ErrorDisplay'
import SuccessDisplay from '@/components/SuccessDisplay'
import DebugPanel from '@/components/DebugPanel'
import NewAnnouncementModal from '@/components/NewAnnouncementModel' 
import AnnouncementCard from '@/components/AnnouncementCard'

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

export default function AnnouncementsPage() {
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('Semua Mata Kuliah')

  const fetchAnnouncements = async () => {
    try {
      setDebugInfo((prev: any) => ({ ...prev, loading: true }))
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*, users(full_name)')
        .order('created_at', { ascending: false })

      setDebugInfo((prev: any) => ({
        ...prev,
        loading: false,
        loadResult: { data, error },
        timestamp: new Date().toISOString()
      }))

      if (error) throw error
      setAllAnnouncements(data || [])
    } catch (err: any) {
      console.error('Error loading announcements:', err)
      setError({
        status: err.code ? parseInt(err.code) : undefined,
        message: err.message || 'Failed to load announcements',
        details: err
      })
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function handleCreateAnnouncement(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw { status: 401, message: 'Unauthorized' }

      const title = formData.get('title') as string
      const content = formData.get('content') as string
      const tag = formData.get('tag') as string 

      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        tag: tag.trim(),
        created_by: user.id,
      }
      setDebugInfo((prev: any) => ({ ...prev, creating: announcementData }))
      const { data, error: insertError } = await supabase
        .from('announcements')
        .insert(announcementData)
        .select()
      if (insertError) throw insertError
      setSuccess('Pengumuman berhasil dibuat!')
      setIsModalOpen(false) 
      await fetchAnnouncements() 
      
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (err: any) {
      console.error(' Error creating announcement:', err)
      setError({
        status: err.status || 500,
        message: err.message || 'Pengumuman gagal dibuat',
        details: err.details || err
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = useMemo(() => {
    if (selectedCourse === 'Semua Mata Kuliah') {
      return allAnnouncements
    }
    return allAnnouncements.filter(post => post.tag === selectedCourse)
  }, [allAnnouncements, selectedCourse])


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcement Board</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          + Buat Pengumuman
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
        <NewAnnouncementModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateAnnouncement}
        />
      )}
      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      {success && <SuccessDisplay message={success} onDismiss={() => setSuccess(null)} />}
      <DebugPanel data={debugInfo} label="Debug Information" />

      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map(post => (
            <AnnouncementCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Tidak ada pengumuman</p>
            <p className="text-sm">
              {selectedCourse === 'Semua Mata Kuliah' 
                ? 'Buat pengumuman pertama Anda!' 
                : `Tidak ada pengumuman untuk ${selectedCourse}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}